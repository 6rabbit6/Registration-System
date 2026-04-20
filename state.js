const event = {
  id: "event_2026_short_track_02",
  name: "【运动员报名通道】2026年北京市短道速滑联赛第二站",
  registrationStartDate: "2026-04-16",
  registrationEndDate: "2026-05-06",
  competitionStartDate: "2026-05-12",
  competitionEndDate: "2026-05-17",
  location: "北京市冰上项目训练基地",
  regulationFile: {
    name: "竞赛规程 2026年北京市短道速滑联赛V4.pdf",
    url: "#",
  },
  commitmentFile: {
    name: "运动员参赛和健康承诺书.pdf",
    url: "#",
  },
  bannerImage: {
    mode: "none",
    name: "",
    type: "",
    size: 0,
    url: "",
    sourceUrl: "",
    fitMode: "cover",
    storageKey: "",
    uploadedAt: "",
  },
  shareCard: {
    title: "2026年北京市短道速滑联赛第二站",
    description: "",
    imageUrl: "",
  },
  description: [
    "一、主办单位：北京市滑冰协会。",
    "二、承办单位：北京市世纪星滑冰俱乐部。",
    "三、竞赛时间：2026年5月12日至17日。",
    "四、竞赛地点：北京市冰上项目训练基地。",
    "五、报名成功后进入待审核状态，审核结果以后续通知为准。",
  ],
};

const registrationSettings = {
  maxEventsPerPerson: 2,
  pricingRule: {
    mode: "itemized",
    minEventsPerPerson: 1,
    maxEventsPerPerson: 2,
    baseIncludedCount: 2,
    basePrice: 200,
    extraPricePerItem: 50,
  },
  insuranceRequired: true,
  certificateTypes: [
    { value: "id_card", label: "身份证" },
    { value: "passport", label: "护照" },
  ],
  organizations: [
    { id: "longchen", name: "龙辰体育", enabled: true },
    { id: "sjx", name: "世纪星滑冰俱乐部", enabled: true },
  ],
  groups: [
    {
      id: "u18_male",
      name: "U18组（男）",
      genderLimit: "male",
      minBirthYear: 2008,
      maxBirthYear: 2012,
      events: [
        { id: "500m", name: "500米", fee: 500 },
        { id: "1000m", name: "1000米", fee: 500 },
        { id: "1500m", name: "1500米", fee: 500 },
        { id: "5000m_relay", name: "5000米接力", fee: 500 },
        { id: "2000m_mixed_relay", name: "2000米混合团体接力", fee: 500 },
      ],
    },
    {
      id: "u18_female",
      name: "U18组（女）",
      genderLimit: "female",
      minBirthYear: 2008,
      maxBirthYear: 2012,
      events: [
        { id: "500m", name: "500米", fee: 500 },
        { id: "1000m", name: "1000米", fee: 500 },
        { id: "1500m", name: "1500米", fee: 500 },
        { id: "3000m_relay", name: "3000米接力", fee: 500 },
        { id: "2000m_mixed_relay", name: "2000米混合团体接力", fee: 500 },
      ],
    },
    {
      id: "u15_male",
      name: "U15组（男）",
      genderLimit: "male",
      minBirthYear: 2013,
      maxBirthYear: 2015,
      events: [
        { id: "500m", name: "500米", fee: 500 },
        { id: "1000m", name: "1000米", fee: 500 },
        { id: "1500m", name: "1500米", fee: 500 },
      ],
    },
    {
      id: "u15_female",
      name: "U15组（女）",
      genderLimit: "female",
      minBirthYear: 2013,
      maxBirthYear: 2015,
      events: [
        { id: "500m", name: "500米", fee: 500 },
        { id: "1000m", name: "1000米", fee: 500 },
        { id: "1500m", name: "1500米", fee: 500 },
      ],
    },
    {
      id: "open",
      name: "公开体验组",
      genderLimit: "all",
      minBirthYear: 2006,
      maxBirthYear: 2016,
      events: [
        { id: "skills", name: "基础技能赛", fee: 300 },
        { id: "team_fun", name: "团体趣味赛", fee: 300 },
      ],
    },
  ],
};

const storageKey = "registration-system-v1";
const configStorageKey = "registration-system-admin-config-v1";
const adminAuthStorageKey = "admin-auth-v1";
const maxBannerUploadBytes = 1024 * 1024;
const maxBannerStoredBytes = 760 * 1024;
const bannerMaxWidth = 1200;
const bannerMaxHeight = 675;
const supportedBannerTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const criticalOrderFields = new Set(["gender", "birthDate", "groupId", "eventIds"]);
const lookupStatuses = new Set(["pending_review", "approved", "rejected"]);
const pageTitles = {
  detail: "活动详情",
  form: "填写信息",
  confirm: "报名信息",
  payment: "缴费",
  success: "报名完成",
  registration_lookup: "报名结果查询",
  admin_login: "后台登录",
  admin_dashboard: "后台管理",
  admin_registrations: "报名审核",
  admin_registration_detail: "报名详情",
  admin_stats: "报名统计",
  admin_config: "后台配置",
};

const appState = {
  eventConfig: clone(event),
  registrationConfig: clone(registrationSettings),
};

let formDraft = createEmptyDraft();
let registrationRecord = null;
let order = createEmptyOrder();
let completedRecords = [];
let remoteRegistrations = [];
let adminDraft = null;
let adminAuth = { isLoggedIn: false };
let bannerUrlValidationTimer = null;
let bannerUrlValidationToken = 0;

const uiState = {
  currentPage: "detail",
  currentStep: 0,
  isSubmitting: false,
  isPaying: false,
  toast: "",
  message: "",
  validationErrors: {},
  lookupQuery: "",
  lookupResults: [],
  lookupSearched: false,
  lastAutoParsedIdNumber: "",
  lastInvalidIdNumber: "",
  lastDuplicateCertificateNumber: "",
  remoteAdminLoaded: false,
  remoteAdminLoading: false,
  adminLogin: {
    username: "",
    password: "",
    error: "",
  },
  adminRegistrationFilter: "all",
  adminRegistrationSearch: "",
  selectedRegistrationNo: "",
  rejectReasonDraft: "",
  moreMenuOpen: false,
  wheelPicker: {
    open: false,
    type: "",
    options: [],
    selectedValue: "",
    tempValue: "",
  },
};

function isAdminLoggedIn() {
  return Boolean(adminAuth?.isLoggedIn);
}

function loadAdminAuth() {
  try {
    const raw = localStorage.getItem(adminAuthStorageKey);
    adminAuth = raw ? JSON.parse(raw) : { isLoggedIn: false };
    adminAuth.isLoggedIn = Boolean(adminAuth.isLoggedIn);
  } catch {
    clearAdminAuth();
  }
}

function saveAdminAuth() {
  localStorage.setItem(adminAuthStorageKey, JSON.stringify({ isLoggedIn: Boolean(adminAuth.isLoggedIn) }));
}

function clearAdminAuth() {
  adminAuth = { isLoggedIn: false };
  localStorage.setItem(adminAuthStorageKey, JSON.stringify(adminAuth));
}

function loadConfig() {
  try {
    const saved = readPersistedConfig();
    if (!saved) {
      resetConfigToDefault({ persist: true });
      return;
    }

    appState.eventConfig = sanitizeEventConfig(saved.eventConfig || saved.event || event);
    appState.registrationConfig = sanitizeRegistrationConfig(saved.registrationConfig || saved.registrationSettings || registrationSettings);
  } catch {
    clearPersistedConfig();
    resetConfigToDefault({ persist: true });
  }
}

function saveConfig() {
  persistConfig({
    eventConfig: appState.eventConfig,
    registrationConfig: appState.registrationConfig,
    updatedAt: nowIso(),
  });
}

function readPersistedConfig() {
  const raw = localStorage.getItem(configStorageKey);
  return raw ? JSON.parse(raw) : null;
}

function persistConfig(data) {
  localStorage.setItem(configStorageKey, JSON.stringify(data));
}

function clearPersistedConfig() {
  localStorage.removeItem(configStorageKey);
}

function getCurrentEventConfig() {
  return appState.eventConfig || event;
}

function getCurrentRegistrationSettings() {
  return appState.registrationConfig || registrationSettings;
}

function getEnabledOrganizations() {
  const settings = getCurrentRegistrationSettings();
  return (Array.isArray(settings.organizations) ? settings.organizations : [])
    .filter((item) => item?.enabled !== false && safeText(item.name).trim())
    .map((item) => ({
      id: safeText(item.id),
      name: safeText(item.name).trim(),
      enabled: item.enabled !== false,
    }));
}

function resetConfigToDefault(options = {}) {
  appState.eventConfig = sanitizeEventConfig(event);
  appState.registrationConfig = sanitizeRegistrationConfig(registrationSettings);
  if (options.persist) saveConfig();
}

function getPricingRule(settings = getCurrentRegistrationSettings()) {
  return sanitizePricingRule(settings.pricingRule, settings);
}

function getDefaultPricingRule(source = {}) {
  const maxEvents = Math.max(1, Number(source.maxEventsPerPerson || registrationSettings.maxEventsPerPerson || 2));
  return {
    mode: "itemized",
    minEventsPerPerson: 1,
    maxEventsPerPerson: maxEvents,
    baseIncludedCount: Math.min(2, maxEvents),
    basePrice: 200,
    extraPricePerItem: 50,
  };
}

function sanitizePricingRule(source = {}, legacySource = {}) {
  const fallback = getDefaultPricingRule(legacySource);
  const mode = source.mode === "tiered" ? "tiered" : "itemized";
  const minEventsPerPerson = Math.max(1, Number(source.minEventsPerPerson || fallback.minEventsPerPerson));
  const maxEventsPerPerson = Math.max(minEventsPerPerson, Number(source.maxEventsPerPerson || legacySource.maxEventsPerPerson || fallback.maxEventsPerPerson));
  const baseIncludedCount = Math.max(1, Number(source.baseIncludedCount || fallback.baseIncludedCount));

  return {
    mode,
    minEventsPerPerson,
    maxEventsPerPerson,
    baseIncludedCount,
    basePrice: Math.max(0, Number(source.basePrice ?? fallback.basePrice) || 0),
    extraPricePerItem: Math.max(0, Number(source.extraPricePerItem ?? fallback.extraPricePerItem) || 0),
  };
}

function sanitizeEventConfig(source) {
  const fallback = event;
  return {
    id: safeText(source?.id || fallback.id),
    name: safeText(source?.name || fallback.name),
    registrationStartDate: safeText(source?.registrationStartDate || fallback.registrationStartDate),
    registrationEndDate: safeText(source?.registrationEndDate || fallback.registrationEndDate),
    competitionStartDate: safeText(source?.competitionStartDate || fallback.competitionStartDate),
    competitionEndDate: safeText(source?.competitionEndDate || fallback.competitionEndDate),
    location: safeText(source?.location || fallback.location),
    regulationFile: {
      name: safeText(source?.regulationFile?.name || fallback.regulationFile.name),
      url: safeText(source?.regulationFile?.url || fallback.regulationFile.url),
    },
    commitmentFile: {
      name: safeText(source?.commitmentFile?.name || fallback.commitmentFile.name),
      url: safeText(source?.commitmentFile?.url || fallback.commitmentFile.url),
    },
    bannerImage: sanitizeBannerImage(source?.bannerImage || fallback.bannerImage),
    shareCard: sanitizeShareCard(source?.shareCard || fallback.shareCard),
    description: normalizeArray(source?.description?.length ? source.description : fallback.description),
  };
}

function sanitizeRegistrationConfig(source) {
  const fallback = registrationSettings;
  const certificateTypes = Array.isArray(source?.certificateTypes) && source.certificateTypes.length ? source.certificateTypes : fallback.certificateTypes;
  const organizations = Array.isArray(source?.organizations) ? source.organizations : fallback.organizations;
  const groups = Array.isArray(source?.groups) && source.groups.length ? source.groups : fallback.groups;
  const pricingRule = sanitizePricingRule(source?.pricingRule, source);
  const sanitized = {
    maxEventsPerPerson: pricingRule.maxEventsPerPerson,
    pricingRule,
    insuranceRequired: Boolean(source?.insuranceRequired ?? fallback.insuranceRequired),
    certificateTypes: certificateTypes.map((item) => ({
      value: safeText(item.value || createCertificateValueFromLabel(item.label)),
      label: safeText(item.label),
    })),
    organizations: organizations.map((item) => ({
      id: safeText(item.id || createOrganizationIdFromName(item.name)),
      name: safeText(item.name),
      enabled: item.enabled !== false,
    })),
    groups: groups.map((group) => ({
      id: safeText(group.id),
      name: safeText(group.name),
      genderLimit: ["male", "female", "all"].includes(group.genderLimit) ? group.genderLimit : "all",
      minBirthYear: Number(group.minBirthYear) || 1900,
      maxBirthYear: Number(group.maxBirthYear) || 2100,
      events: (Array.isArray(group.events) && group.events.length ? group.events : [{ id: "event_default", name: "默认项目", fee: 0 }]).map((item) => ({
        id: safeText(item.id),
        name: safeText(item.name),
        fee: Math.max(0, Number(item.fee) || 0),
      })),
    })),
  };
  prepareAdminConfigForSave({ registrationConfig: sanitized });
  return sanitized;
}

function loadState() {
  try {
    const saved = readPersistedRegistrationState();
    if (!saved) return;
    formDraft = { ...createEmptyDraft(), ...(saved.formDraft || {}) };
    registrationRecord = saved.registrationRecord || null;
    order = saved.order?.id ? saved.order : createEmptyOrder();
    completedRecords = Array.isArray(saved.completedRecords) ? saved.completedRecords : [];
    completedRecords = completedRecords.map(normalizeCompletedRecordEntry);
  } catch {
    clearPersistedRegistrationState();
  }
}

function saveState() {
  persistRegistrationState({
    formDraft,
    registrationRecord,
    order,
    completedRecords,
  });
}

function readPersistedRegistrationState() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : null;
}

function persistRegistrationState(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function clearPersistedRegistrationState() {
  localStorage.removeItem(storageKey);
}

function normalizeCompletedRecordEntry(entry) {
  const record = entry?.record || {};
  return {
    record: {
      ...record,
      rejectReason: record.rejectReason || "",
      reviewedAt: record.reviewedAt || "",
    },
    order: entry?.order || {},
  };
}

function createEmptyDraft() {
  const currentEvent = getCurrentEventConfig();
  const settings = getCurrentRegistrationSettings();
  const firstCertificateType = settings.certificateTypes?.[0]?.value || "id_card";
  return {
    id: createDraftId(),
    eventId: currentEvent.id,
    registrationNo: "",
    certificateType: firstCertificateType,
    certificateNumber: "",
    name: "",
    gender: "",
    birthDate: "",
    age: null,
    birthYear: null,
    phone: "",
    organizationId: "",
    organization: "",
    groupId: "",
    groupName: "",
    eventIds: [],
    eventNames: [],
    insuranceFile: null,
    totalAmount: 0,
    status: "draft",
    errors: {},
    updatedAt: nowIso(),
  };
}

function createEmptyOrder() {
  const currentEvent = getCurrentEventConfig();
  return {
    id: "",
    eventId: currentEvent.id,
    registrationId: "",
    orderNo: "",
    registrationNo: "",
    amount: 0,
    paymentMethod: "mock_wechat",
    paymentStatus: "unpaid",
    reviewStatus: "pending",
    createdAt: "",
    paidAt: "",
  };
}
