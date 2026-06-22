from fastapi import APIRouter

from app.api.routes import auth, groups, maintenance, me, players, results, statistics, votes, voting_sessions

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(groups.router)
api_router.include_router(maintenance.router)
api_router.include_router(me.router)
api_router.include_router(players.router)
api_router.include_router(voting_sessions.router)
api_router.include_router(votes.router)
api_router.include_router(results.router)
api_router.include_router(statistics.router)
