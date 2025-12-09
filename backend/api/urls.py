"""
API URL Configuration for SurfaceFlow AI System
"""
from django.urls import path, include
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.current_user, name='current_user'),
    
    # Modules
    path('modules/', views.list_modules, name='list_modules'),
    path('modules/<str:module_id>/', views.module_detail, name='module_detail'),
    
    # Automations
    path('automations/', include('automations.urls')),
    
    # BuilderTrend Hotel Booking Module
    path('buildertrend/', include('buildertrend.urls')),
]
