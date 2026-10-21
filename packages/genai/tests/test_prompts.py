from genai.prompts import Example, few_shot_prompt


def test_zero_shot_is_instruction_then_open_query():
    prompt = few_shot_prompt("Classify the review.", [], "Great!", "Review", "Sentiment")
    assert prompt == "Classify the review.\n\nReview: Great!\nSentiment:"


def test_few_shot_puts_examples_between_instruction_and_query():
    examples = [Example("I love it", "Positive"), Example("Awful", "Negative")]
    prompt = few_shot_prompt("Classify.", examples, "Meh", "Review", "Sentiment")
    assert prompt == (
        "Classify.\n\n"
        "Review: I love it\nSentiment: Positive\n\n"
        "Review: Awful\nSentiment: Negative\n\n"
        "Review: Meh\nSentiment:"
    )


def test_blank_instruction_is_left_out():
    assert few_shot_prompt("  ", [], "Paris?", "Q", "A") == "Q: Paris?\nA:"
