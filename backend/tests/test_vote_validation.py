from app.schemas.vote import VoteLineCreate, VoteSubmission


def test_vote_submission_accepts_unique_recipients() -> None:
    submission = VoteSubmission(
        votes=[
            VoteLineCreate(recipient_id=1, points=5, justification="Great scene"),
            VoteLineCreate(recipient_id=2, points=5, justification="Smart play"),
        ]
    )
    assert len(submission.votes) == 2
