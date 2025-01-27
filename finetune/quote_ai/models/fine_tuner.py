import openai
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger
from tqdm import tqdm
import time
from ..config.config import TRAINING_CONFIG, API_CONFIG, MODELS_DIR


class QuoteFineTuner:
    def __init__(self, api_key: str):
        """Initialize the fine-tuner with OpenAI API key."""
        openai.api_key = api_key
        self.model_name = TRAINING_CONFIG["model_name"]
        self.max_retries = API_CONFIG["max_retries"]
        self.retry_delay = API_CONFIG["retry_delay"]
        self.timeout = API_CONFIG["timeout"]

    def validate_training_data(self, training_file: Path) -> bool:
        """Validate the training data format."""
        try:
            with open(training_file, "r") as f:
                for line in f:
                    example = json.loads(line)
                    if not self._validate_example(example):
                        return False
            return True
        except Exception as e:
            logger.error(f"Error validating training data: {str(e)}")
            return False

    def _validate_example(self, example: Dict[str, Any]) -> bool:
        """Validate individual training example."""
        if "messages" not in example:
            return False
        messages = example["messages"]
        if not isinstance(messages, list) or len(messages) < 2:
            return False
        required_roles = {"system", "user", "assistant"}
        message_roles = {msg["role"] for msg in messages}
        return required_roles.issubset(message_roles)

    def prepare_training_file(self, training_file: Path) -> str:
        """Upload training file to OpenAI."""
        try:
            with open(training_file, "rb") as f:
                response = openai.files.create(file=f, purpose="fine-tune")
            return response.id
        except Exception as e:
            logger.error(f"Error uploading training file: {str(e)}")
            raise

    def create_fine_tuning_job(
        self, training_file_id: str, validation_file_id: Optional[str] = None
    ) -> str:
        """Create and start a fine-tuning job.

        Args:
            training_file_id: The ID of the uploaded training file
            validation_file_id: Optional ID of a validation file

        Returns:
            The ID of the created fine-tuning job
        """
        try:
            # Prepare the job creation parameters
            job_params = {
                "model": self.model_name,
                "training_file": training_file_id,
                "method": {
                    "type": "supervised",
                    "supervised": {
                        "hyperparameters": {
                            "batch_size": "auto",
                            "learning_rate_multiplier": "auto",
                            "n_epochs": TRAINING_CONFIG.get("num_epochs", "auto"),
                        }
                    },
                },
            }

            # Add optional parameters
            if validation_file_id:
                job_params["validation_file"] = validation_file_id

            if "model_suffix" in TRAINING_CONFIG:
                job_params["suffix"] = TRAINING_CONFIG["model_suffix"]

            # Create the fine-tuning job
            response = openai.fine_tuning.jobs.create(**job_params)
            return response.id

        except Exception as e:
            logger.error(f"Error creating fine-tuning job: {str(e)}")
            raise

    def monitor_fine_tuning(self, job_id: str) -> Dict[str, Any]:
        """Monitor the progress of a fine-tuning job."""
        while True:
            try:
                # Retrieve the job status
                job = openai.fine_tuning.jobs.retrieve(job_id)
                status = job.status

                logger.info(f"Fine-tuning status: {status}")

                if status == "succeeded":
                    # Get the result files if available
                    result_files = []
                    if job.result_files:
                        result_files = [
                            openai.files.retrieve(file_id)
                            for file_id in job.result_files
                        ]

                    return {
                        "status": "success",
                        "model_id": job.fine_tuned_model,
                        "result_files": result_files,
                        "training_metrics": getattr(job, "training_metrics", None),
                        "validation_metrics": getattr(job, "validation_metrics", None),
                    }
                elif status in ["failed", "cancelled"]:
                    return {
                        "status": "failed",
                        "error": getattr(job, "error", None),
                        "failed_at": getattr(job, "failed_at", None),
                    }

                # Add more detailed status information
                if hasattr(job, "trained_tokens"):
                    logger.info(f"Trained tokens: {job.trained_tokens}")
                if hasattr(job, "training_metrics"):
                    logger.info(
                        f"Current loss: {job.training_metrics.get('loss', 'N/A')}"
                    )

                time.sleep(60)  # Check status every minute

            except Exception as e:
                logger.error(f"Error monitoring fine-tuning: {str(e)}")
                time.sleep(self.retry_delay)

    def save_model_info(self, model_info: Dict[str, Any], output_path: Path):
        """Save model information and metrics."""
        try:
            # Ensure the output directory exists
            output_path.mkdir(parents=True, exist_ok=True)

            # Save the model info
            with open(output_path / "model_info.json", "w") as f:
                json.dump(model_info, f, indent=2)

            # Download and save result files if available
            if model_info.get("result_files"):
                for file_data in model_info["result_files"]:
                    file_path = output_path / f"results_{file_data.id}.jsonl"
                    with open(file_path, "wb") as f:
                        content = openai.files.download(file_data.id)
                        f.write(content)
                    logger.info(f"Saved result file: {file_path}")

        except Exception as e:
            logger.error(f"Error saving model info: {str(e)}")
            raise

    def fine_tune(
        self, training_file: Path, validation_file: Optional[Path] = None
    ) -> Dict[str, Any]:
        """Run the complete fine-tuning process."""
        logger.info("Starting fine-tuning process...")

        # Validate training data
        if not self.validate_training_data(training_file):
            raise ValueError("Invalid training data format")

        # Upload training file
        logger.info("Uploading training file...")
        training_file_id = self.prepare_training_file(training_file)

        # Upload validation file if provided
        validation_file_id = None
        if validation_file:
            logger.info("Uploading validation file...")
            if self.validate_training_data(validation_file):
                validation_file_id = self.prepare_training_file(validation_file)
            else:
                logger.warning(
                    "Invalid validation data format, skipping validation file"
                )

        # Create and start fine-tuning job
        logger.info("Creating fine-tuning job...")
        job_id = self.create_fine_tuning_job(training_file_id, validation_file_id)

        # Monitor progress
        logger.info("Monitoring fine-tuning progress...")
        result = self.monitor_fine_tuning(job_id)

        # Save model information
        if result["status"] == "success":
            output_dir = MODELS_DIR / result["model_id"]
            self.save_model_info(result, output_dir)
            logger.info(
                f"Fine-tuning completed successfully. Model saved to {output_dir}"
            )
        else:
            logger.error(f"Fine-tuning failed: {result.get('error', 'Unknown error')}")

        return result
