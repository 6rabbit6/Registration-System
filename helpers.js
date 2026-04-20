function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeText(value) {
  return value == null ? "" : String(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map((item) => safeText(item)).filter(Boolean) : [];
}

function setByPath(target, path, value) {
  const parts = safeText(path).split(".").filter(Boolean);
  let current = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = value;
      return;
    }
    current[part] = current[part] && typeof current[part] === "object" ? current[part] : {};
    current = current[part];
  });
}

function hasDuplicates(values) {
  const filtered = values.filter(Boolean);
  return new Set(filtered).size !== filtered.length;
}

function formatDate(value) {
  if (!value) return "暂无";
  return value.replaceAll("-", "年").replace(/年(\d{2})年/, "年$1月") + "日";
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toFixed(0)}`;
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function getDataUrlByteSize(dataUrl) {
  const base64 = safeText(dataUrl).split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function nowIso() {
  return new Date().toISOString();
}

function parseBirthYear(dateText) {
  if (!dateText || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  return Number(dateText.slice(0, 4));
}

function parseChineseIdCard(idNumber) {
  const value = String(idNumber || "").trim();
  const idPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idPattern.test(value)) return null;
  if (!isValidIdChecksum(value)) return null;

  const year = value.slice(6, 10);
  const month = value.slice(10, 12);
  const day = value.slice(12, 14);
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  const isRealDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day);

  if (!isRealDate) return null;

  return {
    birthDate: `${year}-${month}-${day}`,
    gender: Number(value.charAt(16)) % 2 === 1 ? "male" : "female",
  };
}

function isValidIdChecksum(idNumber) {
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = weights.reduce((total, weight, index) => total + Number(idNumber.charAt(index)) * weight, 0);
  return checks[sum % 11] === idNumber.charAt(17).toUpperCase();
}

function datePart() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}${month}${day}`;
}

function timePart() {
  return Date.now().toString().slice(-8);
}

function randomDigits(length) {
  return String(Math.floor(Math.random() * 10 ** length)).padStart(length, "0");
}

function shortHash(value) {
  const text = safeText(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36).slice(0, 6) || "0";
}

function slugifyConfigText(value, fallback) {
  const normalized = safeText(value)
    .trim()
    .toLowerCase()
    .replace(/米/g, "m")
    .replace(/混合/g, "_mixed_")
    .replace(/团体/g, "_team_")
    .replace(/接力/g, "_relay_")
    .replace(/基础/g, "_base_")
    .replace(/技能/g, "_skill_")
    .replace(/公开/g, "_open_")
    .replace(/体验/g, "_trial_")
    .replace(/组/g, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return normalized || `${fallback}_${shortHash(value)}`;
}

function createUniqueId(baseId, usedIds) {
  const base = safeText(baseId).replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "item";
  let nextId = base;
  let index = 2;
  while (usedIds.has(nextId)) {
    nextId = `${base}_${index}`;
    index += 1;
  }
  usedIds.add(nextId);
  return nextId;
}

function createDraftId() {
  return `REG-DRAFT-${timePart()}-${randomDigits(4)}`;
}

function createRegistrationId() {
  return `REG-ID-${timePart()}-${randomDigits(4)}`;
}

function createOrderId() {
  return `ORDER-ID-${timePart()}-${randomDigits(4)}`;
}

function createRegistrationNo() {
  return `BM-${datePart()}-${randomDigits(6)}`;
}

function createOrderNo() {
  return `ORDER-${datePart()}-${randomDigits(6)}`;
}

function createGroupIdFromConfig(group) {
  const name = safeText(group?.name);
  const gender = ["male", "female", "all"].includes(group?.genderLimit) ? group.genderLimit : "all";
  const uMatch = name.match(/U(\d+)/i);
  const nameSlug = uMatch ? `u${uMatch[1]}` : slugifyConfigText(name, "group");
  return gender === "all" ? nameSlug : `${nameSlug}_${gender}`;
}

function createEventIdFromName(name) {
  return slugifyConfigText(name, "event");
}

function createCertificateValueFromLabel(label) {
  const normalizedLabel = safeText(label).trim();
  const knownValues = {
    身份证: "id_card",
    居民身份证: "id_card",
    护照: "passport",
    港澳通行证: "hk_macau_pass",
    台胞证: "taiwan_pass",
  };
  return knownValues[normalizedLabel] || slugifyConfigText(normalizedLabel, "cert");
}

function createOrganizationIdFromName(name) {
  const normalizedName = safeText(name).trim();
  const knownValues = {
    龙辰体育: "longchen",
    世纪星滑冰俱乐部: "sjx",
  };
  return knownValues[normalizedName] || slugifyConfigText(normalizedName, "org");
}

function parseSuggestedAgeBandFromGroupName(groupName) {
  const match = safeText(groupName).match(/U(\d+)/i);
  if (!match) return null;

  const groupNumber = Number(match[1]);
  const ageBands = {
    6: [5, 6],
    8: [7, 8],
    10: [9, 10],
    12: [11, 12],
    15: [13, 15],
    18: [16, 18],
  };
  const band = ageBands[groupNumber];
  if (!band) return null;

  return {
    groupCode: `U${groupNumber}`,
    minAge: band[0],
    maxAge: band[1],
  };
}

function getSuggestedBirthYearRange(groupName, competitionStartDate) {
  const ageBand = parseSuggestedAgeBandFromGroupName(groupName);
  const competitionYear = parseBirthYear(competitionStartDate);
  if (!ageBand || !competitionYear) return null;

  // Existing registration logic uses age = competitionYear - birthYear.
  // Older athletes have smaller birth years, younger athletes have larger birth years.
  const minBirthYear = competitionYear - ageBand.maxAge;
  const maxBirthYear = competitionYear - ageBand.minAge;

  return {
    ...ageBand,
    competitionYear,
    minBirthYear,
    maxBirthYear,
  };
}

function genderLabel(value) {
  if (value === "male") return "男";
  if (value === "female") return "女";
  return "未选择";
}

function certificateTypeLabel(value) {
  const settings = getCurrentRegistrationSettings();
  return settings.certificateTypes.find((item) => item.value === value)?.label || safeText(value || "暂无");
}

function getReviewStatusLabel(status) {
  const normalizedStatus = normalizeReviewStatus(status);
  const labels = {
    pending_review: "审核中",
    approved: "已通过",
    rejected: "已驳回",
  };
  return labels[normalizedStatus] || "未知";
}

function getReviewStatusClass(status) {
  const normalizedStatus = normalizeReviewStatus(status);
  const classes = {
    pending_review: "lookup-status--pending",
    approved: "lookup-status--approved",
    rejected: "lookup-status--rejected",
  };
  return classes[normalizedStatus] || "lookup-status--pending";
}

function getRejectReasonText(record) {
  return safeText(record?.rejectReason || record?.rejectionReason || record?.reviewRejectReason).trim() || "请联系管理员";
}

function normalizeReviewStatus(status) {
  return safeText(status).trim().toLowerCase();
}

function statusLabel(status) {
  const labels = {
    draft: "草稿",
    pending_payment: "待支付",
    pending_review: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
  return labels[status] || "未知";
}

function paymentStatusLabel(status) {
  const labels = {
    unpaid: "未支付",
    paid: "已支付",
    failed: "支付失败",
    refunded: "已退款",
  };
  return labels[status] || "未知";
}

function createEmptyBannerImage() {
  return {
    mode: "none",
    name: "",
    type: "",
    size: 0,
    url: "",
    sourceUrl: "",
    fitMode: "cover",
    storageKey: "",
    uploadedAt: "",
  };
}

function sanitizeBannerImage(source) {
  const normalized = normalizeBannerDraft(source);
  if (!normalized.url || normalized.url === "#") return createEmptyBannerImage();

  if (normalized.mode === "url") {
    return {
      mode: "url",
      name: normalized.name,
      type: "",
      size: 0,
      url: normalized.url,
      sourceUrl: normalized.sourceUrl || normalized.url,
      fitMode: normalized.fitMode,
      storageKey: "",
      uploadedAt: normalized.uploadedAt,
    };
  }

  if (normalized.mode === "upload") {
    return {
      mode: "upload",
      name: normalized.name,
      type: normalized.type,
      size: normalized.size,
      url: normalized.url,
      sourceUrl: "",
      fitMode: normalized.fitMode,
      storageKey: normalized.storageKey,
      uploadedAt: normalized.uploadedAt,
    };
  }

  return createEmptyBannerImage();
}

function normalizeBannerDraft(source) {
  const url = safeText(source?.url).trim();
  const sourceUrl = safeText(source?.sourceUrl || (source?.mode === "url" ? url : "")).trim();
  let mode = ["none", "upload", "url"].includes(source?.mode) ? source.mode : "none";

  if (source?.mode === "data_url") mode = "upload";
  if (source?.mode === "remote_url") mode = "url";

  if (url && mode === "none") {
    mode = source?.type ? "upload" : "none";
  }

  if (mode === "url" && sourceUrl && !url) {
    mode = "url";
  }

  return {
    mode,
    name: safeText(source?.name),
    type: safeText(source?.type),
    size: Math.max(0, Number(source?.size) || 0),
    url,
    sourceUrl,
    fitMode: getBannerFitMode(source),
    storageKey: safeText(source?.storageKey),
    uploadedAt: safeText(source?.uploadedAt),
    _urlPreviewStatus: source?._urlPreviewStatus || (sourceUrl ? "idle" : "idle"),
    _urlPreviewMessage: source?._urlPreviewMessage || (sourceUrl ? "等待校验图片地址" : "请输入图片地址"),
    _urlPreviewValid: Boolean(source?._urlPreviewValid),
  };
}

function getBannerSourceMode(bannerImage) {
  const banner = normalizeBannerDraft(bannerImage);
  return banner.mode === "url" ? "url" : "upload";
}

function getBannerFitMode(bannerImage) {
  return bannerImage?.fitMode === "contain" ? "contain" : "cover";
}

function getBannerFitClass(fitMode, baseClass) {
  const normalizedFitMode = fitMode === "contain" ? "contain" : "cover";
  return `${baseClass} ${baseClass}--${normalizedFitMode}`;
}

function getBannerUrlStatusText(bannerImage) {
  const banner = normalizeBannerDraft(bannerImage);
  if (!banner.sourceUrl) return "请输入图片地址";
  return banner._urlPreviewMessage || "等待校验图片地址";
}

function getBannerUrlStatusClass(bannerImage) {
  const status = normalizeBannerDraft(bannerImage)._urlPreviewStatus;
  if (status === "valid") return "is-valid";
  if (status === "invalid") return "is-invalid";
  if (status === "pending") return "is-pending";
  return "";
}

function isValidRemoteImageUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateBannerRemoteUrl(url) {
  const imageUrl = safeText(url).trim();
  if (!isValidRemoteImageUrl(imageUrl)) return Promise.resolve({ valid: false });

  return new Promise((resolve) => {
    let settled = false;
    const finish = (valid) => {
      if (settled) return;
      settled = true;
      if (timer && window.clearTimeout) window.clearTimeout(timer);
      resolve({ valid });
    };
    const timer = (window.setTimeout || setTimeout)(() => finish(false), 8000);
    const image = new Image();
    image.onload = () => finish(Boolean(image.naturalWidth && image.naturalHeight));
    image.onerror = () => finish(false);
    image.src = imageUrl;
  });
}

function compressBannerImage(file) {
  return loadImageFromFile(file).then((image) => {
    const ratio = Math.min(1, bannerMaxWidth / image.naturalWidth, bannerMaxHeight / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器不支持图片压缩");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const qualitySteps = [0.82, 0.72, 0.62, 0.52];
    for (const quality of qualitySteps) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const size = getDataUrlByteSize(dataUrl);
      if (size <= maxBannerStoredBytes) {
        return { dataUrl, size, type: "image/jpeg" };
      }
    }

    throw new Error(`压缩后仍超过 ${formatFileSize(maxBannerStoredBytes)}，请换一张更小的图片`);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const urlApi = window.URL || window.webkitURL;
    if (!urlApi?.createObjectURL) {
      reject(new Error("当前浏览器不支持本地图片读取"));
      return;
    }
    const objectUrl = urlApi.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      urlApi.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      urlApi.revokeObjectURL(objectUrl);
      reject(new Error("图片读取失败，请更换文件"));
    };
    image.src = objectUrl;
  });
}
