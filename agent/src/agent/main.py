import json
import os

from litestar import Litestar, post
from msgspec import Struct
from smolagents import LiteLLMModel

model = LiteLLMModel(
    model_id="openrouter/openrouter/free",
    api_key=os.environ["OPENROUTER_API_KEY"],
    api_base="https://openrouter.ai/api/v1"
)


class Entry(Struct):
    id:str
    kind:str
    text:str
    tech_stack:list[str]


class RankRequest(Struct):
    job_description:str
    entries:list[Entry]

class RankedEntry(Struct):
    id:str 
    score:int
    reason:str

class RankResponse(Struct):
    rankings:list[RankedEntry]

RANK_PROMPT = """Rank each entry by relevance to the job description, 0-100.
Return ONLY valid JSON: {{"rankings": [{{"id": str, "score": int, "reason": str}}]}}
No markdown, no preamble, no extra text."""


@post("/rank")
async def rank(data: RankRequest) -> RankResponse:
    entries_text = "\n\n".join(
        f"ID: {e.id}\nType: {e.kind}\nTech: {', '.join(e.tech_stack)}\nText: {e.text}"
        for e in data.entries
    )
    messages = [{
        "role": "user",
        "content": f"{RANK_PROMPT}\n\nJob description:\n{data.job_description}\n\nEntries:\n{entries_text}",
    }]
    response = model(messages)

    content = response.content
    if content is None:
        raise ValueError("model returned no content")
    if isinstance(content, list):
        # join text parts if the model returned structured content blocks
        content = "".join(
            part.get("text", "") for part in content if isinstance(part, dict)
        )

    parsed = json.loads(content)
    return RankResponse(rankings=[RankedEntry(**r) for r in parsed["rankings"]])


app = Litestar([rank])
