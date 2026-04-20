const remoteConfigStorageKey = "registration-system-supabase-config-v1";
// Configure by setting window.REGISTRATION_SUPABASE_CONFIG or this localStorage key.

function getRemoteConfig() {
  const inlineConfig = window.REGISTRATION_SUPABASE_CONFIG || {};
  const storedConfig = readStoredRemoteConfig();
  const config = {
    supabaseUrl: safeText(inlineConfig.supabaseUrl || inlineConfig.url || storedConfig.supabaseUrl || storedConfig.url).replace(/\/$/, ""),
    supabaseAnonKey: safeText(inlineConfig.supabaseAnonKey || inlineConfig.anonKey || storedConfig.supabaseAnonKey || storedConfig.anonKey),
    eventId: safeText(inlineConfig.eventId || storedConfig.eventId || getCurrentEventConfig()?.id || event.id),
  };
  return {
    ...config,
    enabled: Boolean(config.supabaseUrl && config.supabaseAnonKey),
  };
}

function readStoredRemoteConfig() {
  try {
    const raw = localStorage.getItem(remoteConfigStorageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isRemoteEnabled() {
  return getRemoteConfig().enabled;
}

async function supabaseRestRequest(tableName, options = {}) {
  const config = getRemoteConfig();
  if (!config.enabled) return null;

  const query = options.query ? `?${options.query}` : "";
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${tableName}${query}`, {
    method: options.method || "GET",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function remoteEq(column, value) {
  return `${column}=eq.${encodeURIComponent(safeText(value))}`;
}

function remoteIn(column, values) {
  return `${column}=in.(${values.map((item) => encodeURIComponent(item)).join(",")})`;
}

async function loadRemoteEvent() {
  const config = getRemoteConfig();
  if (!config.enabled) return null;

  const queryParts = ["select=*", "limit=1"];
  if (config.eventId) queryParts.push(remoteEq("id", config.eventId));
  const rows = await supabaseRestRequest("events", { query: queryParts.join("&") });
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? mapDbEventToEventConfig(row) : null;
}

async function loadRemoteOrganizations() {
  const config = getRemoteConfig();
  if (!config.enabled) return null;

  const rows = await supabaseRestRequest("organizations", { query: "select=*&order=name.asc" });
  if (!Array.isArray(rows)) return null;

  const filteredRows = rows.filter((row) => !row.event_id || row.event_id === config.eventId);
  return filteredRows.map(mapDbOrganizationToConfig).filter((item) => item.name);
}

async function createRemoteRegistration(record, recordOrder) {
  if (!isRemoteEnabled()) return null;
  const payload = mapRegistrationToDbRow(record, recordOrder);
  const rows = await supabaseRestRequest("registrations", {
    method: "POST",
    body: payload,
  });
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? mapDbRegistrationToEntry(row) : null;
}

async function findRemoteDuplicateRegistration(eventId, certificateNumber) {
  const config = getRemoteConfig();
  const normalizedCertificateNumber = normalizeCertificateForDuplicate(certificateNumber);
  if (!config.enabled || !eventId || !normalizedCertificateNumber) return null;

  const query = [
    "select=*",
    remoteEq("event_id", eventId),
    remoteEq("certificate_number", normalizedCertificateNumber),
    remoteIn("status", ["pending_payment", "pending_review", "approved"]),
    "limit=1",
  ].join("&");
  const rows = await supabaseRestRequest("registrations", { query });
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? mapDbRegistrationToEntry(row) : null;
}

async function searchRemoteRegistrations(query) {
  const config = getRemoteConfig();
  if (!config.enabled) return null;

  const normalizedQuery = safeText(query).trim();
  const queryParts = [
    "select=*",
    remoteEq("event_id", config.eventId),
    remoteEq("payment_status", "paid"),
    remoteIn("status", ["pending_review", "approved", "rejected"]),
    "order=created_at.desc",
  ];

  if (normalizedQuery) {
    const searchColumn = getRemoteRegistrationSearchColumn(normalizedQuery);
    const searchValue = searchColumn === "certificate_number" || searchColumn === "registration_no" ? normalizedQuery.toUpperCase() : normalizedQuery;
    queryParts.push(`${searchColumn}=eq.${encodeURIComponent(searchValue)}`);
  }

  const rows = await supabaseRestRequest("registrations", { query: queryParts.join("&") });
  return Array.isArray(rows) ? rows.map(mapDbRegistrationToEntry) : [];
}

async function reviewRemoteRegistration(registrationNo, nextStatus, rejectReason = "") {
  const config = getRemoteConfig();
  if (!config.enabled) return null;

  const status = nextStatus === "approved" ? "approved" : "rejected";
  const body = {
    status,
    reject_reason: status === "rejected" ? safeText(rejectReason).trim() : "",
    reviewed_at: nowIso(),
  };
  const query = [remoteEq("event_id", config.eventId), remoteEq("registration_no", registrationNo)].join("&");
  const rows = await supabaseRestRequest("registrations", {
    method: "PATCH",
    query,
    body,
  });
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? mapDbRegistrationToEntry(row) : null;
}

function getRemoteRegistrationSearchColumn(query) {
  if (/^1[3-9]\d{9}$/.test(query)) return "phone";
  if (query.toUpperCase().startsWith("BM-")) return "registration_no";
  return "certificate_number";
}

function mapDbEventToEventConfig(row) {
  const bannerUrl = pickRemoteValue(row, "banner_image_url", "banner_url", "bannerImageUrl");
  return {
    id: safeText(pickRemoteValue(row, "id")),
    name: safeText(pickRemoteValue(row, "name")),
    registrationStartDate: safeText(pickRemoteValue(row, "registration_start_date", "registrationStartDate")),
    registrationEndDate: safeText(pickRemoteValue(row, "registration_end_date", "registrationEndDate")),
    competitionStartDate: safeText(pickRemoteValue(row, "competition_start_date", "competitionStartDate")),
    competitionEndDate: safeText(pickRemoteValue(row, "competition_end_date", "competitionEndDate")),
    location: safeText(pickRemoteValue(row, "location")),
    regulationFile: {
      name: safeText(pickRemoteValue(row, "regulation_file_name", "regulationFileName", "regulation_name")),
      url: safeText(pickRemoteValue(row, "regulation_file_url", "regulationFileUrl", "regulation_url")),
    },
    commitmentFile: {
      name: safeText(pickRemoteValue(row, "commitment_file_name", "commitmentFileName", "commitment_name")),
      url: safeText(pickRemoteValue(row, "commitment_file_url", "commitmentFileUrl", "commitment_url")),
    },
    bannerImage: {
      mode: bannerUrl ? "url" : "none",
      name: safeText(pickRemoteValue(row, "banner_image_name", "bannerImageName")),
      type: "",
      size: 0,
      url: safeText(bannerUrl),
      sourceUrl: safeText(bannerUrl),
      fitMode: safeText(pickRemoteValue(row, "banner_fit_mode", "bannerFitMode")) === "contain" ? "contain" : "cover",
      storageKey: "",
      uploadedAt: safeText(pickRemoteValue(row, "banner_uploaded_at", "bannerUploadedAt")),
    },
    shareCard: {
      title: safeText(pickRemoteValue(row, "share_title", "shareTitle")),
      description: safeText(pickRemoteValue(row, "share_description", "shareDescription")),
      imageUrl: safeText(pickRemoteValue(row, "share_image_url", "shareImageUrl")),
    },
    description: normalizeRemoteDescription(pickRemoteValue(row, "description")),
  };
}

function mapDbOrganizationToConfig(row) {
  return {
    id: safeText(pickRemoteValue(row, "id")),
    name: safeText(pickRemoteValue(row, "name")),
    enabled: pickRemoteValue(row, "enabled") !== false,
  };
}

function mapRegistrationToDbRow(record, recordOrder) {
  const insuranceFileUrl = getRemoteInsuranceFileUrl(record?.insuranceFile);
  return {
    id: createRemoteRegistrationPrimaryId(record),
    event_id: safeText(record?.eventId || recordOrder?.eventId || getCurrentEventConfig().id),
    registration_no: safeText(record?.registrationNo),
    certificate_type: safeText(record?.certificateType),
    certificate_number: normalizeCertificateForDuplicate(record?.certificateNumber),
    name: safeText(record?.name),
    gender: safeText(record?.gender),
    birth_date: safeText(record?.birthDate),
    birth_year: Number(record?.birthYear) || null,
    age: Number(record?.age) || null,
    phone: safeText(record?.phone),
    organization_id: safeText(record?.organizationId),
    organization: safeText(record?.organization),
    group_id: safeText(record?.groupId),
    group_name: safeText(record?.groupName),
    event_ids: normalizeArray(record?.eventIds),
    event_names: normalizeArray(record?.eventNames),
    insurance_uploaded: Boolean(record?.insuranceFile),
    insurance_file_url: insuranceFileUrl,
    total_amount: Number(recordOrder?.amount ?? record?.totalAmount ?? 0) || 0,
    status: safeText(record?.status || "pending_review"),
    payment_status: safeText(recordOrder?.paymentStatus || "paid"),
    order_no: safeText(recordOrder?.orderNo),
    paid_at: safeText(recordOrder?.paidAt),
    reject_reason: safeText(record?.rejectReason),
    reviewed_at: safeText(record?.reviewedAt),
    submitted_at: safeText(record?.submittedAt || recordOrder?.createdAt),
    created_at: safeText(record?.submittedAt || recordOrder?.createdAt || nowIso()),
    updated_at: safeText(record?.updatedAt || nowIso()),
  };
}

function createRemoteRegistrationPrimaryId(record) {
  const currentId = safeText(record?.id).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentId)) return currentId;
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return currentId || createRegistrationId();
}

function mapDbRegistrationToEntry(row) {
  const record = {
    id: safeText(row.id),
    eventId: safeText(row.event_id),
    registrationNo: safeText(row.registration_no),
    certificateType: safeText(row.certificate_type),
    certificateNumber: safeText(row.certificate_number),
    name: safeText(row.name),
    gender: safeText(row.gender),
    birthDate: safeText(row.birth_date),
    birthYear: Number(row.birth_year) || null,
    age: Number(row.age) || null,
    phone: safeText(row.phone),
    organizationId: safeText(row.organization_id),
    organization: safeText(row.organization || row.team_name),
    groupId: safeText(row.group_id),
    groupName: safeText(row.group_name),
    eventIds: normalizeArray(row.event_ids),
    eventNames: normalizeArray(row.event_names),
    insuranceFile: row.insurance_uploaded
      ? {
          name: "已上传",
          type: "remote",
          size: 0,
          previewUrl: safeText(row.insurance_file_url),
        }
      : null,
    totalAmount: Number(row.total_amount) || 0,
    status: safeText(row.status),
    errors: {},
    rejectReason: safeText(row.reject_reason),
    reviewedAt: safeText(row.reviewed_at),
    submittedAt: safeText(row.submitted_at || row.created_at),
    updatedAt: safeText(row.updated_at),
  };

  return {
    record,
    order: {
      id: "",
      eventId: record.eventId,
      registrationId: record.id,
      orderNo: safeText(row.order_no),
      registrationNo: record.registrationNo,
      amount: record.totalAmount,
      paymentMethod: "mock_wechat",
      paymentStatus: safeText(row.payment_status || "paid"),
      reviewStatus: "pending",
      createdAt: safeText(row.created_at || row.submitted_at),
      paidAt: safeText(row.paid_at),
    },
  };
}

function pickRemoteValue(source, ...keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value != null && value !== "") return value;
  }
  return "";
}

function normalizeRemoteDescription(value) {
  if (Array.isArray(value)) return value.map((item) => safeText(item).trim()).filter(Boolean);
  return safeText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getRemoteInsuranceFileUrl(file) {
  const previewUrl = safeText(file?.previewUrl).trim();
  if (!previewUrl || previewUrl.startsWith("data:")) return "";
  return previewUrl;
}
