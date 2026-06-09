// Supabase REST Service for Harrington Law PI Intake Dashboard

export const SUPABASE_URL = "https://vyjxnlhmrtdjiokmajqr.supabase.co/rest/v1";
export const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5anhubGhtcnRkamlva21hanFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkxMjg4NywiZXhwIjoyMDk2NDg4ODg3fQ.MU8__UtDJz9cA01mRygM_FW8NWI9gKVitt80gnPiVM8";

export interface IntakeCase {
  id: string | null;
  call_id: string;
  call_type: string | null;
  call_status: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  call_duration_seconds: string | null;
  ended_reason: string | null;
  client_name: string | null;
  phone: string | null;
  customer_number: string | null;
  transcript: string | null;
  recording_url: string | null;
  stereo_recording_url: string | null;
  log_url: string | null;
  accident_date: string | null;
  incident_summary: string | null;
  police_report: string | null;
  medical_documentation: string | null;
  insurance_status: string | null;
  at_fault: string | null;
  case_evaluation_memo: string | null;
  liability_assessment: string | null;
  liability_reason: string | null;
  viability_score: string | null;
  recommended_action: string | null;
  extraction_status: string | null;
  clio_contact_id: string | null;
  clio_matter_id: string | null;
  clio_matter_status: string | null;
  clio_note_id: string | null;
  sms_message: string | null;
  sms_status: string | null;
  sms_sent_at: string | null;
  docuseal_submission_id: string | null;
  docuseal_status: string | null;
  docuseal_document_url: string | null;
  docuseal_audit_log_url: string | null;
  retainer_sent_at: string | null;
  retainer_signed_at: string | null;
  slack_status: string | null;
  slack_message: string | null;
  slack_sent_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  raw_payload: string | null;
}

export interface CallLog {
  id: string;
  call_id: string;
  assistant_id: string | null;
  assistant_name: string | null;
  phone_number_id: string | null;
  inbound_number: string | null;
  customer_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: string | null;
  duration_minutes: string | null;
  ended_reason: string | null;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  stereo_recording_url: string | null;
  pcap_url: string | null;
  log_url: string | null;
  cost: string | null;
  stt_cost: string | null;
  llm_cost: string | null;
  tts_cost: string | null;
  vapi_cost: string | null;
  total_cost: string | null;
  model_name: string | null;
  voice_provider: string | null;
  voice_id: string | null;
  transcriber_provider: string | null;
  transcriber_model: string | null;
  raw_payload: string | null;
  created_at: string | null;
}

export interface ClioRecord {
  id: string | null;
  row_id?: string | null;
  call_id: string;
  client_name: string | null;
  phone: string | null;
  clio_contact_id: string | null;
  clio_contact_response: string | null;
  clio_matter_id: string | null;
  clio_matter_status: string | null;
  clio_matter_description: string | null;
  practice_area: string | null;
  clio_matter_response: string | null;
  clio_note_id: string | null;
  clio_note_subject: string | null;
  clio_note_detail: string | null;
  clio_note_response: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CaseEvaluation {
  id: string;
  call_id: string;
  client_name: string | null;
  accident_date: string | null;
  incident_summary: string | null;
  liability_assessment: string | null;
  liability_reason: string | null;
  medical_documentation: string | null;
  police_report_status: string | null;
  police_report: string | null;
  insurance_status: string | null;
  viability_score: string | null;
  recommended_action: string | null;
  case_evaluation_memo: string | null;
  extraction_status: string | null;
  created_at: string | null;
  raw_payload: string | null;
}

export interface DocusealRetainer {
  id: string;
  call_id: string;
  clio_matter_id: string | null;
  client_name: string | null;
  client_email: string | null;
  template_id: string | null;
  submission_id: string | null;
  external_id: string | null;
  status: string | null;
  sent_at: string | null;
  completed_at: string | null;
  expire_at: string | null;
  document_url: string | null;
  audit_log_url: string | null;
  docuseal_response: string | null;
  webhook_payload: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const getHeaders = () => ({
  "apikey": SUPABASE_SERVICE_ROLE,
  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
});

export const supabaseService = {
  async fetchIntakeCases(): Promise<IntakeCase[]> {
    const response = await fetch(`${SUPABASE_URL}/pi_intake_cases?order=created_at.desc.nullslast`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch intake cases: ${response.statusText}`);
    return response.json();
  },

  async fetchCallLogs(): Promise<CallLog[]> {
    const response = await fetch(`${SUPABASE_URL}/pi_call_logs?order=created_at.desc.nullslast`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch call logs: ${response.statusText}`);
    return response.json();
  },

  async fetchClioRecords(): Promise<ClioRecord[]> {
    const response = await fetch(`${SUPABASE_URL}/pi_clio_records?order=created_at.desc.nullslast`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch Clio records: ${response.statusText}`);
    return response.json();
  },

  async fetchCaseEvaluations(): Promise<CaseEvaluation[]> {
    const response = await fetch(`${SUPABASE_URL}/pi_case_evaluations?order=created_at.desc.nullslast`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch case evaluations: ${response.statusText}`);
    return response.json();
  },

  async fetchDocusealRetainers(): Promise<DocusealRetainer[]> {
    const response = await fetch(`${SUPABASE_URL}/pi_docuseal_retainers?order=created_at.desc.nullslast`, {
      method: "GET",
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Failed to fetch Docuseal retainers: ${response.statusText}`);
    return response.json();
  },

  async updateIntakeCase(id: string, updates: Partial<IntakeCase>): Promise<IntakeCase> {
    // PostgREST patch request
    const response = await fetch(`${SUPABASE_URL}/pi_intake_cases?call_id=eq.${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error(`Failed to update intake case: ${response.statusText}`);
    const data = await response.json();
    return data[0];
  },

  async createIntakeCase(data: Partial<IntakeCase>): Promise<IntakeCase> {
    const response = await fetch(`${SUPABASE_URL}/pi_intake_cases`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Failed to create intake case: ${response.statusText}`);
    const records = await response.json();
    return records[0];
  }
};
