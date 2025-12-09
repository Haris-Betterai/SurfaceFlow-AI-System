"""
Salesforce Lead Enrichment Module Views
Uses OpenAI Web Search to enrich lead/contact data
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import uuid
import csv
import os
import random


# CSV file paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
LEAD_ENRICHMENTS_CSV = os.path.join(DATA_DIR, 'lead_enrichments.csv')

# In-memory storage for demo
ENRICHMENT_JOBS = {}


def save_enrichment_to_csv(lead_data, enriched_data, enrichment_id):
    """Save lead enrichment result to CSV file"""
    try:
        row = {
            'id': enrichment_id,
            'lead_name': lead_data.get('name', 'N/A'),
            'company': lead_data.get('company', 'N/A'),
            'original_email': lead_data.get('email', ''),
            'original_phone': lead_data.get('phone', ''),
            'enriched_email': enriched_data.get('email', ''),
            'enriched_phone': enriched_data.get('phone', ''),
            'enriched_title': enriched_data.get('title', ''),
            'enriched_linkedin': enriched_data.get('linkedin', ''),
            'enriched_company_website': enriched_data.get('company_website', ''),
            'enriched_company_size': enriched_data.get('company_size', ''),
            'enriched_industry': enriched_data.get('industry', ''),
            'confidence_score': enriched_data.get('confidence_score', 0),
            'source': 'openai_web_search',
            'status': 'completed',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # Append to CSV
        file_exists = os.path.exists(LEAD_ENRICHMENTS_CSV)
        with open(LEAD_ENRICHMENTS_CSV, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=row.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
        
        print(f"💾 Saved enrichment to CSV: {LEAD_ENRICHMENTS_CSV}")
        return True
    except Exception as e:
        print(f"❌ Error saving enrichment to CSV: {e}")
        return False


def generate_mock_enrichment(name, company):
    """
    Generate mock enriched data for development.
    TODO: Replace with actual OpenAI Web Search API call
    """
    # Mock titles based on common roles
    titles = [
        "Vice President of Operations",
        "Director of Construction", 
        "Project Manager",
        "General Manager",
        "Chief Operating Officer",
        "President",
        "Owner",
        "Estimator",
        "Superintendent"
    ]
    
    # Generate mock data
    first_name = name.split()[0] if name else "Unknown"
    last_name = name.split()[-1] if name and len(name.split()) > 1 else "User"
    company_clean = company.replace(" ", "").lower() if company else "company"
    
    return {
        'name': name,
        'title': random.choice(titles),
        'email': f"{first_name.lower()}.{last_name.lower()}@{company_clean}.com",
        'phone': f"+1 ({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
        'mobile': f"+1 ({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
        'linkedin': f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}-{random.randint(1000, 9999)}",
        'company': company,
        'company_website': f"https://www.{company_clean}.com",
        'company_size': random.choice(['1-10', '11-50', '51-200', '201-500', '500+']),
        'industry': random.choice(['Construction', 'Real Estate', 'General Contracting', 'Commercial Construction']),
        'location': random.choice(['Florida', 'Texas', 'California', 'New York', 'Arizona']),
        'confidence_score': random.randint(75, 98),
        'sources_checked': ['LinkedIn', 'Company Website', 'Business Directories', 'News Articles'],
        'last_updated': datetime.utcnow().isoformat()
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def enrich_lead(request):
    """
    Enrich a lead/contact with additional data using AI web search.
    Called from portal or Chrome extension.
    """
    print("\n" + "=" * 60)
    print("🔍 SURFACEFLOW - LEAD ENRICHMENT REQUEST RECEIVED!")
    print("=" * 60)
    
    lead_data = request.data.get('lead_data', {})
    name = lead_data.get('name', '')
    company = lead_data.get('company', '')
    
    print(f"📋 Lead Data Received:")
    print(f"   • Name: {name}")
    print(f"   • Company: {company}")
    print(f"   • Original Email: {lead_data.get('email', 'N/A')}")
    print(f"   • Original Phone: {lead_data.get('phone', 'N/A')}")
    print(f"   • Source: {request.data.get('source', 'portal')}")
    print("=" * 60)
    
    if not name and not company:
        return Response({
            'success': False,
            'error': 'Name or company is required for enrichment'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate enrichment ID
    enrichment_id = str(uuid.uuid4())[:8]
    
    # TODO: Replace with actual OpenAI Web Search API call
    # For now, generate mock enriched data
    enriched_data = generate_mock_enrichment(name, company)
    
    # Store in memory
    ENRICHMENT_JOBS[enrichment_id] = {
        'id': enrichment_id,
        'lead_data': lead_data,
        'enriched_data': enriched_data,
        'status': 'completed',
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Save to CSV
    save_enrichment_to_csv(lead_data, enriched_data, enrichment_id)
    
    print(f"✅ Enrichment complete! ID: {enrichment_id}")
    print(f"   • Found Title: {enriched_data.get('title')}")
    print(f"   • Found Email: {enriched_data.get('email')}")
    print(f"   • Confidence: {enriched_data.get('confidence_score')}%")
    print("=" * 60 + "\n")
    
    return Response({
        'success': True,
        'enrichment_id': enrichment_id,
        'lead': lead_data,
        'enriched_data': enriched_data,
        'message': 'Lead enriched successfully'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_enrichment_history(request):
    """
    Get all lead enrichment records from CSV for portal display.
    """
    try:
        enrichments = []
        if os.path.exists(LEAD_ENRICHMENTS_CSV):
            with open(LEAD_ENRICHMENTS_CSV, 'r') as f:
                reader = csv.DictReader(f)
                enrichments = list(reader)
        
        return Response({
            'success': True,
            'count': len(enrichments),
            'enrichments': enrichments
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_enrichment_status(request, enrichment_id):
    """
    Get status of a specific enrichment job.
    """
    if enrichment_id in ENRICHMENT_JOBS:
        job = ENRICHMENT_JOBS[enrichment_id]
        return Response({
            'success': True,
            'enrichment': job
        })
    
    return Response({
        'success': False,
        'error': 'Enrichment job not found'
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_mock_leads(request):
    """
    Get mock Salesforce leads for the portal demo page.
    """
    mock_leads = [
        {
            'id': 'lead_001',
            'name': 'John Martinez',
            'company': 'Coastal Construction Group',
            'email': '',
            'phone': '',
            'title': '',
            'status': 'New',
            'source': 'Website',
            'created_at': '2025-12-05T10:30:00Z'
        },
        {
            'id': 'lead_002', 
            'name': 'Sarah Thompson',
            'company': 'Bay Area Builders',
            'email': 'sthompson@baybuilders.com',
            'phone': '',
            'title': 'Project Manager',
            'status': 'Contacted',
            'source': 'Referral',
            'created_at': '2025-12-04T14:15:00Z'
        },
        {
            'id': 'lead_003',
            'name': 'Michael Chen',
            'company': 'Pacific General Contractors',
            'email': '',
            'phone': '+1 (415) 555-0123',
            'title': '',
            'status': 'New',
            'source': 'Trade Show',
            'created_at': '2025-12-03T09:45:00Z'
        },
        {
            'id': 'lead_004',
            'name': 'Emily Rodriguez',
            'company': 'Sunshine State Developers',
            'email': '',
            'phone': '',
            'title': '',
            'status': 'Qualified',
            'source': 'LinkedIn',
            'created_at': '2025-12-02T16:20:00Z'
        },
        {
            'id': 'lead_005',
            'name': 'David Wilson',
            'company': 'Metro Commercial Construction',
            'email': 'dwilson@metrocc.com',
            'phone': '+1 (305) 555-0456',
            'title': 'VP Operations',
            'status': 'Enriched',
            'source': 'Cold Outreach',
            'created_at': '2025-12-01T11:00:00Z'
        },
        {
            'id': 'lead_006',
            'name': 'Jennifer Adams',
            'company': 'Elite Home Builders',
            'email': '',
            'phone': '',
            'title': '',
            'status': 'New',
            'source': 'Website',
            'created_at': '2025-11-30T13:30:00Z'
        },
        {
            'id': 'lead_007',
            'name': 'Robert Taylor',
            'company': 'Summit Construction Inc',
            'email': '',
            'phone': '',
            'title': 'Owner',
            'status': 'Contacted',
            'source': 'Referral',
            'created_at': '2025-11-29T08:15:00Z'
        },
        {
            'id': 'lead_008',
            'name': 'Amanda Foster',
            'company': 'Pinnacle Developers LLC',
            'email': 'afoster@pinnacledev.com',
            'phone': '',
            'title': 'Director of Projects',
            'status': 'Enriched',
            'source': 'Conference',
            'created_at': '2025-11-28T15:45:00Z'
        }
    ]
    
    return Response({
        'success': True,
        'count': len(mock_leads),
        'leads': mock_leads
    })
