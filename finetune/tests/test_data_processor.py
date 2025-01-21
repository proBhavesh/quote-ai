import pytest
from pathlib import Path
from quote_ai.utils.data_processor import QuoteDataProcessor


@pytest.fixture
def processor():
    return QuoteDataProcessor()


def test_clean_text(processor):
    """Test text cleaning functionality."""
    # Test currency standardization
    text = "The cost is $ 1,234.56 and $567"
    cleaned = processor.clean_text(text)
    assert cleaned == "The cost is $1,234.56 and $567"

    # Test measurement standardization
    text = "Area: 1000 sq ft and 2000 square feet"
    cleaned = processor.clean_text(text)
    assert cleaned == "Area: 1000 sq.ft. and 2000 sq.ft."


def test_extract_quote_components(processor):
    """Test quote component extraction."""
    text = """
    Project Specifications: Build a new deck
    Materials:
    - Wood planks: $500
    - Screws: $50
    Total: $1000
    """
    components = processor.extract_quote_components(text)

    assert components["total_cost"] == 1000.0
    assert len(components["materials"]) == 2
    assert components["project_specs"].strip() == "Build a new deck"


def test_format_training_example(processor):
    """Test training example formatting."""
    components = {
        "project_specs": "Build a new deck",
        "materials": [
            {"item": "Wood planks", "cost": 500.0},
            {"item": "Screws", "cost": 50.0},
        ],
        "total_cost": 1000.0,
    }

    example = processor.format_training_example(components)

    assert "messages" in example
    assert len(example["messages"]) == 3
    assert example["messages"][0]["role"] == "system"
    assert example["messages"][1]["role"] == "user"
    assert example["messages"][2]["role"] == "assistant"

    # Check if materials are included in the user message
    user_message = example["messages"][1]["content"]
    assert "Wood planks" in user_message
    assert "Screws" in user_message

    # Check if costs are included in the assistant message
    assistant_message = example["messages"][2]["content"]
    assert "$500.00" in assistant_message
    assert "$50.00" in assistant_message
    assert "$1000.00" in assistant_message
