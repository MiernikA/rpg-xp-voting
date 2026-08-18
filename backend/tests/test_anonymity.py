from app.models.vote import Vote
from app.services.anonymity import anonymized_vote_comments


def make_vote(vote_id: int, voter_id: int, text: str) -> Vote:
    return Vote(
        id=vote_id,
        session_id=10,
        voter_id=voter_id,
        recipient_id=20,
        points=5,
        justification=text,
    )


def test_anonymized_vote_comments_return_only_comment_texts() -> None:
    votes = [
        make_vote(1, 101, "Alice comment"),
        make_vote(2, 102, "Bob comment"),
        make_vote(3, 103, ""),
        make_vote(4, 104, "Carol comment"),
    ]

    comments = anonymized_vote_comments(votes)

    assert set(comments) == {"Alice comment", "Bob comment", "Carol comment"}
    assert all(":" not in comment for comment in comments)
