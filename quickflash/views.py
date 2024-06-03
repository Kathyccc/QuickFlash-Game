from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from quickflash.forms import LoginForm, RegisterForm
from django.contrib import messages
from django.http import Http404, HttpResponse
from quickflash.models import PlayerScore
import json
from django.template.defaultfilters import date
from datetime import datetime
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import redirect

@login_required
def home(request):
    context = {}

    # Generate a new token for the current user
    refresh = RefreshToken.for_user(request.user)
    access_token = str(refresh.access_token)

    print("Access token:", access_token)
    context['access'] = access_token
    return render(request, 'quickflash/home.html', context) 
    
def login_action(request):
    context = {}

    # Display the registration form if this is a GET request
    if request.method == 'GET':
        context['form'] = LoginForm()
        return render(request, 'quickflash/login.html', context)

    form = LoginForm(request.POST)
    context['form'] = form

    if not form.is_valid():
        context['form_errors'] = form.errors
        return render(request, 'quickflash/login.html', context)

    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password'])

    if new_user is not None:
        login(request, new_user)
        
        # Create JWT tokens
        refresh = RefreshToken.for_user(new_user)
        access_token = str(refresh.access_token)
        context['access'] = access_token

        print("Access token:", access_token)

        return render(request, 'quickflash/home.html', context)
    else:
        context['form_errors'] = "Invalid username or password"
        return render(request, 'quickflash/login.html', context)

def register_action(request):
    context = {}

    # Just display the registration form if this is a GET request.
    if request.method == 'GET':
        context['form'] = RegisterForm()
        return render(request, 'quickflash/register.html', context)

    # Creates a bound form from the request POST parameters and makes the 
    # form available in the request context dictionary.
    form = RegisterForm(request.POST)
    context['form'] = form

    # Validates the form.
    if not form.is_valid():
        context['form_errors'] = form.errors
        return render(request, 'quickflash/register.html', context)

    # At this point, the form data is valid.  Register and login the user.
    new_user = User.objects.create_user(username=form.cleaned_data['username'], 
                                        password=form.cleaned_data['password1'],
                                        email=form.cleaned_data['email'],
                                        )

    new_user.save()
    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password1'])

    login(request, new_user)

    # # Create JWT tokens
    refresh = RefreshToken.for_user(new_user)
    access_token = str(refresh.access_token)
    context['access'] = access_token
    
    return redirect(reverse('home'), context)

def logout_action(request):
    logout(request)
    return redirect(reverse('login'))

def final_scores(request):
    scores = []
    for model_item in PlayerScore.objects.all(): 
        score = model_item.score_round1 + model_item.score_round2 + model_item.score_round3
        scores.append([model_item.player.username, score, model_item.score_round1, model_item.score_round2, model_item.score_round3, model_item.completed_round3])
        # print(timezone.localtime(model_item.completed_round3))
    scores.sort(key=lambda x: x[1], reverse = True)
        
    json_data = []
    usernames = set()
    for row in scores:
        if row[0] not in usernames:
            json_data.append({
                "username": row[0],
                "score": row[1],
                "score_round1": row[2],
                "score_round2": row[3],
                "score_round3": row[4],
                "end_time": date(timezone.localtime(row[5]), "n/j/Y g:i A"),
            })
            usernames.add(row[0])
    top_10_scores = json_data[:10]

    json_scores = json.dumps(top_10_scores, cls=DateTimeEncoder)
    return HttpResponse(json_scores, content_type='application/json')

def oauth_login_redirect(request):
    if request.user.is_authenticated:
        # Generate JWT tokens
        refresh = RefreshToken.for_user(request.user)
        access_token = str(refresh.access_token)

        context = {'access': access_token}
        return render(request, 'quickflash/home.html', context)
    else:
        return redirect('/quickflash/login')
    
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%dT%H:%M:%S.%fZ")  # Format the datetime as a string
        return super().default(obj)

