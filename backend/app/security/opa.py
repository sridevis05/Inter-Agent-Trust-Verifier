import datetime
import re
from typing import Dict, Any, List, Optional
from app.models import Policy

class OPAEngine:
    @staticmethod
    def check_time_range(range_str: str, current_time: datetime.time) -> bool:
        """Check if current time is within HH:MM-HH:MM range."""
        try:
            start_str, end_str = range_str.split("-")
            sh, sm = map(int, start_str.split(":"))
            eh, em = map(int, end_str.split(":"))
            
            start_time = datetime.time(sh, sm)
            end_time = datetime.time(eh, em)
            
            if start_time <= end_time:
                return start_time <= current_time <= end_time
            else:  # Over midnight
                return current_time >= start_time or current_time <= end_time
        except Exception:
            return False

    @classmethod
    def evaluate_policy(
        cls, 
        role: str, 
        action: str, 
        resource: str, 
        payload: Dict[str, Any], 
        context: Dict[str, Any], 
        policies: List[Policy]
    ) -> tuple[bool, str]:
        """
        OPA-inspired policy evaluator. Enforces RBAC + ABAC.
        - Deny takes precedence (Default Deny).
        - Evaluates conditional rules matching role, action, and resource.
        """
        matched_allow = False
        deny_reasons = []

        # Context defaults
        current_time = datetime.datetime.utcnow().time()
        
        for policy in policies:
            # Check if policy matches sender's role
            if policy.subject_role != role:
                continue
            
            # Check action and resource patterns (allow wildcards e.g. *)
            action_match = (policy.action == "*" or policy.action.lower() == action.lower())
            resource_match = (policy.resource == "*" or policy.resource.lower() == resource.lower())
            
            if not (action_match and resource_match):
                continue
            
            # Evaluate ABAC conditions
            conditions_pass = True
            if policy.conditions:
                for cond_key, cond_val in policy.conditions.items():
                    # Time condition check
                    if cond_key == "time_of_day":
                        if not cls.check_time_range(cond_val, current_time):
                            conditions_pass = False
                            deny_reasons.append(f"Action restricted to business hours: {cond_val}")
                            break
                    
                    # VPN check
                    elif cond_key == "source_vpn":
                        request_vpn = context.get("source_vpn", False)
                        if cond_val is True and not request_vpn:
                            conditions_pass = False
                            deny_reasons.append("Action requires Company VPN authentication")
                            break
                    
                    # Numeric limits e.g., max_amount
                    elif cond_key == "max_amount":
                        payload_amount = payload.get("amount") or payload.get("params", {}).get("amount", 0)
                        if payload_amount > cond_val:
                            conditions_pass = False
                            deny_reasons.append(f"Request value ₹{payload_amount} exceeds authorization limit of ₹{cond_val}")
                            break
                            
                    # Target database environment check
                    elif cond_key == "allowed_env":
                        target_env = payload.get("env") or payload.get("params", {}).get("env", "Production")
                        if cond_val.lower() != target_env.lower():
                            conditions_pass = False
                            deny_reasons.append(f"Action not permitted on '{target_env}' environment (Authorized only for: {cond_val})")
                            break

            if conditions_pass:
                if policy.effect.lower() == "deny":
                    return False, f"Explicit Deny matched: Policy ID {policy.id} denies {role} executing {action} on {resource}."
                elif policy.effect.lower() == "allow":
                    matched_allow = True

        if matched_allow:
            return True, "Authorization criteria passed."
            
        if deny_reasons:
            return False, f"Authorization failed: {'; '.join(deny_reasons)}"
            
        return False, f"Implicit Deny: No policy permits {role} to perform {action} on {resource}."
