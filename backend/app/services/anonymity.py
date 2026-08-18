import random

from app.models.vote import Vote


def anonymized_vote_comments(votes: list[Vote]) -> list[str]:
    comments = [vote.justification for vote in votes if vote.justification]
    random.SystemRandom().shuffle(comments)
    return comments
