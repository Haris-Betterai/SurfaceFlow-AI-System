"""
Salesforce Lead Enrichment URL Configuration
"""
from django.urls import path
from . import views

urlpatterns = [
    # Lead enrichment endpoints
    path('enrich/', views.enrich_lead, name='enrich_lead'),
    path('history/', views.get_enrichment_history, name='enrichment_history'),
    path('status/<str:enrichment_id>/', views.get_enrichment_status, name='enrichment_status'),
    
    # Mock data endpoints for portal demo
    path('mock-leads/', views.get_mock_leads, name='mock_leads'),
]
