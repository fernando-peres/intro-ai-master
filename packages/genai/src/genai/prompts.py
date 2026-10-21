"""Few-shot prompt building: the same text a base model or an assistant receives."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Example:
    input: str
    output: str


def few_shot_prompt(
    instruction: str,
    examples: list[Example],
    query: str,
    input_name: str = "Input",
    output_name: str = "Output",
) -> str:
    """Instruction, then one block per example, then the query with its output left open.

    No examples gives the zero-shot prompt. The prompt ends with `"{output_name}:"` and no
    trailing space, so a base model's next token is the answer.
    """
    blocks = [instruction.strip()] if instruction.strip() else []
    blocks += [f"{input_name}: {ex.input}\n{output_name}: {ex.output}" for ex in examples]
    blocks.append(f"{input_name}: {query}\n{output_name}:")
    return "\n\n".join(blocks)
