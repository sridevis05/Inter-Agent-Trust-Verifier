import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Tenant, Agent, Policy
from app.security.crypto import generate_rsa_key_pair, encrypt_private_key
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def db_session():
    # Setup SQLite test db
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        # Seed Tenant Org A
        tenant_a = Tenant(id="org_a", name="Organization A")
        db.add(tenant_a)
        
        # Seed Tenant Org B (for cross-tenant validation tests)
        tenant_b = Tenant(id="org_b", name="Organization B")
        db.add(tenant_b)
        db.commit()
        
        # Seed active Agent A
        pub_key, priv_key = generate_rsa_key_pair()
        encrypted_priv = encrypt_private_key(priv_key)
        agent_a = Agent(
            id="planner_agent",
            tenant_id="org_a",
            name="Planner Agent",
            kid="key_planner_agent_v1",
            public_key_pem=pub_key,
            encrypted_private_key_pem=encrypted_priv,
            role="PlannerAgent",
            permissions=["*"],
            delegation_scope={},
            status="Active",
            trust_score=100.0
        )
        db.add(agent_a)
        
        # Seed active Agent B
        pub_key_b, priv_key_b = generate_rsa_key_pair()
        encrypted_priv_b = encrypt_private_key(priv_key_b)
        agent_b = Agent(
            id="developer_agent",
            tenant_id="org_a",
            name="Developer Agent",
            kid="key_developer_agent_v1",
            public_key_pem=pub_key_b,
            encrypted_private_key_pem=encrypted_priv_b,
            role="DeveloperAgent",
            permissions=["*"],
            delegation_scope={},
            status="Active",
            trust_score=100.0
        )
        db.add(agent_b)
        
        # Seed Agent C in Tenant B (for cross-tenant checks)
        pub_key_c, priv_key_c = generate_rsa_key_pair()
        encrypted_priv_c = encrypt_private_key(priv_key_c)
        agent_c = Agent(
            id="org_b_developer",
            tenant_id="org_b",
            name="Org B Developer",
            kid="key_org_b_developer_v1",
            public_key_pem=pub_key_c,
            encrypted_private_key_pem=encrypted_priv_c,
            role="DeveloperAgent",
            permissions=["*"],
            delegation_scope={},
            status="Active",
            trust_score=100.0
        )
        db.add(agent_c)
        
        # Seed basic OPA policy
        policy = Policy(
            id="pol_01",
            tenant_id="org_a",
            subject_role="PlannerAgent",
            action="WriteCode",
            resource="SourceRepo",
            effect="Allow",
            conditions={},
            version=1,
            is_active=True
        )
        db.add(policy)
        db.commit()
        
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
