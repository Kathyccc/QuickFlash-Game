from datetime import timezone
from channels.generic.websocket import AsyncWebsocketConsumer

from webapps import settings
from .models import User, GameSession, PlayerScore
import json
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.utils import timezone
from django.contrib.auth.models import User
import jwt
from urllib.parse import parse_qs

class GameConsumer(AsyncWebsocketConsumer):
    group_name = 'game_group'
    user = None

    async def connect(self):
        query_string = parse_qs(self.scope['query_string'].decode())
        token = query_string.get('token', [None])[0]

        if token:
            user = await self.get_user_from_token(token)
            if user:
                self.user = user
                await self.channel_layer.group_add(
                    self.group_name, 
                    self.channel_name
                    )
                
                await self.accept()
            else:
                await self.close(code=4001)  
        else:
            await self.close(code=4000)  
    
    @database_sync_to_async
    def decrement_players(self):
        current_players = cache.get('current_players', 0)
        new_count = max(0, current_players - 1)
        cache.set('current_players', new_count)
        print(f'current_players: {current_players}, new_count: {new_count}')

    @database_sync_to_async
    def get_latest_game_session_players(self):
        latest_game_session = GameSession.objects.latest('start_time')
        gamesession_players = latest_game_session.players.all()
        if self.user in gamesession_players:
            print(f"User {self.user} disconnected from game channel")
        return latest_game_session.players.count()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name, 
            self.channel_name
        )     
        await self.decrement_players()     
        database_players = await self.get_latest_game_session_players()
        # stop the game if one of the player left
        if database_players == 2:
            # Notify other players about the player exit
            await self.send_player_exit_message()

    async def receive(self, **kwargs):
        if 'text_data' not in kwargs:
            self.send_error('you must send text_data')
            return

        try:
            data = json.loads(kwargs['text_data'])
        except:
            self.send_error('invalid JSON sent to server')
            return

        if 'action' not in data:
            self.send_error('action property not sent in JSON')
            return
        
        action = data['action']

        if 'action' in data:
            if action == 'start_game':
                await self.start_game()

            elif action == 'add_player':
                current_players = await self.get_current_players()
                await self.set_current_players(current_players + 1)
                current_players = await self.get_current_players()
                print("server current_players", current_players)
                await self.broadcast_game_current_player_message()

            elif action == 'submit_score':
                round_number = data.get('round_number')
                score = data.get('score', 0)

                # testing
                print(str(round_number) + ", " + str(score))

                if round_number in [1, 2, 3]:
                    await self.update_score(score, round_number)
                    # Check if this was the last score for the round for all players
                    all_scores_submitted = await self.check_all_players_submitted(round_number)
                    print(f"all_scores_submitted: {all_scores_submitted}, round_number: {round_number}")
                    
                    if all_scores_submitted and round_number == 3:
                        await self.handle_game_over()
                else:
                    self.send_error(f'Invalid round number: "{round_number}"')
            else: 
                self.send_error(f'Invalid action property: "{action}"')

    @database_sync_to_async
    def start_game(self):
        print(f"start_game: {self.user}")
        # Find the latest game session that hasn't ended yet        
        try:
            game_session = GameSession.objects.filter(end_time__isnull=True).latest('start_time')
            # if GameSession players count is 3, create a new game session
            if game_session.players.count() >= 3:
                game_session = GameSession.objects.create(start_time=timezone.localtime(timezone.now()))
                print(timezone.localtime(timezone.now()))
        except GameSession.DoesNotExist:
            # If there is no current game session, create a new one
            game_session = GameSession.objects.create()
        
        print(f"game_session.id: {game_session.id}")
        game_session.players.add(self.user)
        game_session.save()

    @database_sync_to_async
    def update_score(self, score, round_number):
        print(f"update_score: {score}, {round_number}")
        print(f"self.user: {self.user}")
        game_session = GameSession.objects.latest('start_time')
        player_score, created = PlayerScore.objects.get_or_create(
            game_session=game_session, 
            player=self.user
        )

        now = timezone.localtime(timezone.now())
        if round_number == 1:
            player_score.score_round1 += score
            player_score.completed_round1 = now
        elif round_number == 2:
            player_score.score_round2 += score
            player_score.completed_round2 = now
        elif round_number == 3:
            player_score.score_round3 += score
            player_score.completed_round3 = now

        player_score.save()


    async def send_error(self, error_message):
        await self.send(text_data=json.dumps({'error': error_message}))

    async def broadcast_game_current_player_message(self):
        current_players = await self.get_current_players()
        print("current_players", current_players)  # for testing
        if current_players == 3:
            print("Broadcast current_player == 3")
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'game_current_player',  
                    'message': current_players  
                }
            )
            
        else:
            print(f"Send current_player {current_players}")
            await self.send(text_data=json.dumps({'message': current_players}))

    @database_sync_to_async
    def get_current_players(self):
        return cache.get('current_players', 0)

    @database_sync_to_async
    def set_current_players(self, value):
        cache.set('current_players', value)
    
    @database_sync_to_async
    def check_all_players_submitted(self, round_number):
        game_session = GameSession.objects.latest('start_time')

        if round_number == 1:
            players_finished = PlayerScore.objects.filter(
                game_session=game_session,
                completed_round1__isnull=False
            ).count()
        elif round_number == 2:
            players_finished = PlayerScore.objects.filter(
                game_session=game_session,
                completed_round2__isnull=False
            ).count()
        elif round_number == 3:
            players_finished = PlayerScore.objects.filter(
                game_session=game_session,
                completed_round3__isnull=False
            ).count()
        else:
            return False

        print(f"players_finished: {players_finished}, game_session.players.count(): {game_session.players.count()}")
        return players_finished == game_session.players.count()


    async def handle_game_over(self):
        # After all rounds have been completed and all scores have been submitted
        final_scores = await self.gather_final_scores()
        await self.broadcast_final_scores(final_scores)

    @database_sync_to_async
    def gather_final_scores(self):
        game_session = GameSession.objects.latest('start_time')

        # Get the scores for all rounds for all players
        scores = list(game_session.playerscore_set.values(
            'player__username',
            'score_round1',
            'score_round2',
            'score_round3'
        ))

        # Calculate total scores for each player
        for score in scores:
            score['total'] = score['score_round1'] + score['score_round2'] + score['score_round3']

        sorted_scores = sorted(scores, key=lambda x: x['total'], reverse=True)    
        return sorted_scores

    @database_sync_to_async
    def end_game(self):
        # End the game session by setting the end_time 
        game_session = GameSession.objects.filter(end_time__isnull=True).latest('start_time')
        game_session.end_time = timezone.localtime(timezone.now())
        game_session.save()
        
        print(f"end time: {game_session.end_time}")

        self.set_current_players(0)

    async def broadcast_final_scores(self, scores):
        final_scores = {
            'type': 'final_scores',  
            'scores': scores
        }
        # Send message to group
        await self.channel_layer.group_send(
            self.group_name,
            final_scores
        )
        await self.end_game()
        await self.broadcast_close_signal()
        
        
    async def broadcast_close_signal(self):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'websocket_close',
            }
        )

    async def game_current_player(self, event):
        # Handle sending the current player count to the WebSocket
        await self.send(text_data=json.dumps({'message': event['message']}))

    async def final_scores(self, event):
        # Handle the final scores message
        await self.send(text_data=json.dumps({'final_scores': event['scores']}))

    async def websocket_close(self, event):
        await self.close()

    async def send_player_exit_message(self):
        # Notify other players about the player exit
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'player_exit',
                'message': 'player_exit'
            }
        )

    async def player_exit(self, event):
        # Send a message to the group about the player exit
        await self.send(text_data=json.dumps({'message': event['message']}))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return User.objects.get(id=payload['user_id'])
        except jwt.ExpiredSignatureError:
            # Handle expired token
            return None
        except jwt.InvalidTokenError:
            # Handle invalid token
            return None
        except User.DoesNotExist:
            # Handle user not found
            return None
