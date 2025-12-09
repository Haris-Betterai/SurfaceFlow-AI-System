"""
Automations Module URL Configuration
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_automations, name='list_automations'),
    path('trigger/', views.trigger_automation, name='trigger_automation'),
    path('<str:job_id>/', views.automation_detail, name='automation_detail'),
    path('<str:job_id>/cancel/', views.cancel_automation, name='cancel_automation'),
]
