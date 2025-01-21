import pdfplumber
import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
from loguru import logger
import re
from ..config.config import DATA_CONFIG, DATA_DIR


class QuoteDataProcessor:
    def __init__(self):
        self.min_length = DATA_CONFIG["min_quote_length"]
        self.max_length = DATA_CONFIG["max_quote_length"]
        self.currency = DATA_CONFIG["currency_symbol"]

    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract text content from a PDF file."""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = "\n".join(page.extract_text() for page in pdf.pages)
            return text
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
            return ""

    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text.strip())
        # Standardize currency format
        text = re.sub(r"\$\s*(\d+)", rf"{self.currency}\1", text)
        # Standardize measurements
        text = re.sub(
            r"(\d+)\s*(sq\s*ft|square\s*feet)", r"\1 sq.ft.", text, flags=re.IGNORECASE
        )
        return text

    def extract_quote_components(self, text: str) -> Dict[str, Any]:
        """Extract structured information from quote text."""
        components = {
            "materials": [],
            "labor_costs": [],
            "total_cost": None,
            "project_specs": "",
            "timeline": "",
        }

        # Extract total cost (assuming it's preceded by "Total:" or similar)
        total_match = re.search(rf"{self.currency}(\d+(?:,\d+)*(?:\.\d+)?)", text)
        if total_match:
            components["total_cost"] = float(total_match.group(1).replace(",", ""))

        # Extract materials (items with costs)
        materials = re.findall(
            r"([A-Za-z\s]+):\s*" + rf"{self.currency}(\d+(?:,\d+)*(?:\.\d+)?)", text
        )
        components["materials"] = [
            {"item": m[0].strip(), "cost": float(m[1].replace(",", ""))}
            for m in materials
        ]

        # Extract project specifications (looking for common keywords)
        spec_matches = re.findall(
            r"(?:Specifications?|Requirements?|Scope):\s*([^$]+?)(?=\n|$)", text
        )
        if spec_matches:
            components["project_specs"] = spec_matches[0].strip()

        return components

    def format_training_example(self, components: Dict[str, Any]) -> Dict[str, str]:
        """Format extracted components into training example format."""
        # Format input (human message)
        input_text = f"Project Specifications:\n{components['project_specs']}\n\n"
        if components["materials"]:
            input_text += "Required Materials:\n"
            input_text += "\n".join(f"- {m['item']}" for m in components["materials"])

        # Format output (assistant message)
        output_text = (
            f"Based on the project specifications, here's the detailed quote:\n\n"
        )
        for material in components["materials"]:
            output_text += (
                f"- {material['item']}: {self.currency}{material['cost']:.2f}\n"
            )
        if components["total_cost"]:
            output_text += (
                f"\nTotal Quote: {self.currency}{components['total_cost']:.2f}"
            )

        return {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a construction quote assistant.",
                },
                {"role": "user", "content": input_text},
                {"role": "assistant", "content": output_text},
            ]
        }

    def process_pdf_directory(self, input_dir: Path) -> List[Dict[str, str]]:
        """Process all PDFs in a directory and return training examples."""
        training_data = []
        for pdf_path in input_dir.glob("*.pdf"):
            try:
                text = self.extract_text_from_pdf(pdf_path)
                if not text:
                    continue

                cleaned_text = self.clean_text(text)
                if len(cleaned_text) < self.min_length:
                    logger.warning(f"Skipping {pdf_path}: Text too short")
                    continue

                components = self.extract_quote_components(cleaned_text)
                if not components["total_cost"]:
                    logger.warning(f"Skipping {pdf_path}: No valid quote found")
                    continue

                example = self.format_training_example(components)
                training_data.append(example)

            except Exception as e:
                logger.error(f"Error processing {pdf_path}: {str(e)}")
                continue

        return training_data

    def save_training_data(self, data: List[Dict[str, str]], output_file: Path):
        """Save processed training data to JSONL file."""
        with open(output_file, "w") as f:
            for example in data:
                f.write(json.dumps(example) + "\n")
