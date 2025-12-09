"""
Salesforce Platform URL Configuration
"""
from django.urls import path, include

urlpatterns = [
    # Lead enrichment routes - available at /api/v1/salesforce/leads/
    path('leads/', include('platforms.salesforce.lead_enrichment.urls')),
]
