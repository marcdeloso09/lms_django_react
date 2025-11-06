from django.urls import path
from .views import *
from . import views
from .views import signup_user, login_user

urlpatterns = [
    path('signup/', views.signup_user, name='signup'),
    path('login/', views.login_user, name='login'),
    path('participant-id/', views.get_participant_id, name='get_participant_id'),  # 👈 Add this
    path('save-behavior/', views.save_behavior, name='save_behavior'), 
]