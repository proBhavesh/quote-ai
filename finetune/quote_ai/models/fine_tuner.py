import openai
import json
from pathlib import Path
from typing import Dict, Any, List
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
                response = openai.File.create(file=f, purpose="fine-tune")
            return response.id
        except Exception as e:
            logger.error(f"Error uploading training file: {str(e)}")
            raise

    def create_fine_tuning_job(self, training_file_id: str) -> str:
        """Create and start a fine-tuning job."""
        try:
            response = openai.FineTuningJob.create(
                training_file=training_file_id,
                model=self.model_name,
                hyperparameters={
                    "n_epochs": TRAINING_CONFIG["num_epochs"],
                    "batch_size": TRAINING_CONFIG["batch_size"],
                    "learning_rate_multiplier": TRAINING_CONFIG["learning_rate"],
                },
            )
            return response.id
        except Exception as e:
            logger.error(f"Error creating fine-tuning job: {str(e)}")
            raise

    def monitor_fine_tuning(self, job_id: str) -> Dict[str, Any]:
        """Monitor the progress of a fine-tuning job."""
        while True:
            try:
                job = openai.FineTuningJob.retrieve(job_id)
                status = job.status

                logger.info(f"Fine-tuning status: {status}")
                if status == "succeeded":
                    return {
                        "status": "success",
                        "model_id": job.fine_tuned_model,
                        "training_metrics": job.result,
                    }
                elif status == "failed":
                    return {"status": "failed", "error": job.error}

                time.sleep(60)  # Check status every minute
            except Exception as e:
                logger.error(f"Error monitoring fine-tuning: {str(e)}")
                time.sleep(self.retry_delay)

    def save_model_info(self, model_info: Dict[str, Any], output_path: Path):
        """Save model information and metrics."""
        try:
            with open(output_path / "model_info.json", "w") as f:
                json.dump(model_info, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving model info: {str(e)}")

    def fine_tune(self, training_file: Path) -> Dict[str, Any]:
        """Run the complete fine-tuning process."""
        logger.info("Starting fine-tuning process...")

        # Validate training data
        if not self.validate_training_data(training_file):
            raise ValueError("Invalid training data format")

        # Upload training file
        logger.info("Uploading training file...")
        file_id = self.prepare_training_file(training_file)

        # Create and start fine-tuning job
        logger.info("Creating fine-tuning job...")
        job_id = self.create_fine_tuning_job(file_id)

        # Monitor progress
        logger.info("Monitoring fine-tuning progress...")
        result = self.monitor_fine_tuning(job_id)

        # Save model information
        if result["status"] == "success":
            output_dir = MODELS_DIR / result["model_id"]
            output_dir.mkdir(parents=True, exist_ok=True)
            self.save_model_info(result, output_dir)
            logger.info(
                f"Fine-tuning completed successfully. Model saved to {output_dir}"
            )
        else:
            logger.error("Fine-tuning failed")

        return result
