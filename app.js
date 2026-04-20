const screen = document.querySelector("#screen");
const bottomBar = document.querySelector("#bottomBar");
const headerTitle = document.querySelector("#headerTitle");
const progressSteps = document.querySelector("#progressSteps");
const modalRoot = document.querySelector("#modalRoot");
const phoneShell = document.querySelector(".phone-shell");
const moreMenuRoot = document.querySelector("#moreMenuRoot");

init();

function init() {
  loadAdminAuth();
  loadConfig();
  loadState();
  normalizeDraftAfterConfigChange({ silent: true });
  syncDerivedDraftFields();
  restorePageFromHistoryState();
  bindEvents();
  render();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  window.addEventListener("popstate", handlePopState);
}

function restorePageFromHistoryState() {
  const historyPage = getHistoryPage();
  const targetPage = historyPage || uiState.currentPage || "detail";
  const guardedPage = preparePageNavigation(targetPage);
  uiState.currentPage = guardedPage;
  replaceBrowserHistoryState(guardedPage);
}

function handlePopState(event) {
  const page = event.state?.currentPage || "detail";
  goToPage(page, { fromHistory: true });
}

function handleClick(eventTarget) {
  if (eventTarget.target.closest(".wheel-picker-panel") && !eventTarget.target.closest("[data-action]")) {
    return;
  }

  const actionButton = eventTarget.target.closest("[data-action]");
  if (!actionButton) {
    if (uiState.moreMenuOpen && !eventTarget.target.closest(".more-menu-panel")) {
      closeMoreMenu();
    }
    return;
  }

  const action = actionButton.dataset.action;
  if (action === "toggle-more-menu") {
    uiState.moreMenuOpen = !uiState.moreMenuOpen;
    renderMoreMenu();
    return;
  }
  if (action === "close-more-menu") {
    closeMoreMenu();
    return;
  }
  if (action === "open-wheel-picker") {
    openWheelPicker(actionButton.dataset.pickerType);
    return;
  }
  if (action === "close-wheel-picker") {
    closeWheelPicker();
    return;
  }
  if (action === "confirm-wheel-picker") {
    confirmWheelPicker();
    return;
  }
  if (action === "select-wheel-option") {
    selectWheelPickerOption(actionButton.dataset.value);
    return;
  }
  if (uiState.moreMenuOpen) closeMoreMenu();

  if (action === "share-event") {
    handleShareEvent();
  }
  if (action === "copy-event-link") {
    handleCopyEventLink();
  }
  if (action === "menu-go-lookup") {
    goToPage("registration_lookup");
  }
  if (action === "menu-go-admin") {
    if (isAdminLoggedIn()) {
      goToPage("admin_dashboard");
    }
  }
  if (action === "menu-go-admin-config") {
    if (isAdminLoggedIn()) {
      openAdminConfigPage();
    }
  }
  if (action === "menu-export-approved") {
    if (isAdminLoggedIn()) {
      exportApprovedRegistrationsJson();
    }
  }
  if (action === "back") {
    handleBack();
  }
  if (action === "home") {
    if (["admin_registrations", "admin_registration_detail", "admin_stats", "admin_config"].includes(uiState.currentPage)) {
      goToPage("admin_dashboard");
      return;
    }
    goToPage("detail");
  }
  if (action === "start") {
    startRegistration();
  }
  if (action === "lookup") {
    goToPage("registration_lookup");
  }
  if (action === "admin-entry") {
    goToPage(isAdminLoggedIn() ? "admin_dashboard" : "admin_login");
  }
  if (action === "admin-login") {
    handleAdminLogin();
  }
  if (action === "admin-logout") {
    handleAdminLogout();
  }
  if (action === "admin-go-registrations") {
    goToPage("admin_registrations");
  }
  if (action === "admin-go-stats") {
    goToPage("admin_stats");
  }
  if (action === "admin-go-config") {
    openAdminConfigPage();
  }
  if (action === "admin-filter-registrations") {
    uiState.adminRegistrationFilter = actionButton.dataset.filter || "all";
    render();
  }
  if (action === "admin-view-registration") {
    openAdminRegistrationDetail(actionButton.dataset.registrationNo);
  }
  if (action === "admin-approve-registration") {
    approveRegistration(uiState.selectedRegistrationNo);
  }
  if (action === "admin-reject-registration") {
    rejectRegistration(uiState.selectedRegistrationNo, uiState.rejectReasonDraft);
  }
  if (action === "admin-back-dashboard") {
    goToPage("admin_dashboard");
  }
  if (action === "admin-back-registrations") {
    goToPage("admin_registrations");
  }
  if (action === "admin-config") {
    openAdminConfigPage();
  }
  if (action === "export-approved") {
    if (uiState.currentPage !== "admin_dashboard" || !isAdminLoggedIn()) {
      goToPage("admin_login");
      showToast("请先登录后台");
      return;
    }
    exportApprovedRegistrationsJson();
  }
  if (action === "save-admin-config") {
    saveAdminConfigDraft();
  }
  if (action === "reset-admin-config") {
    resetAdminConfigDraftToDefault();
  }
  if (action === "remove-banner-image") {
    removeBannerImageFromAdminDraft();
  }
  if (action === "clear-banner-url") {
    clearBannerUrlFromAdminDraft();
  }
  if (action === "add-cert-type") {
    addCertificateTypeConfig();
  }
  if (action === "remove-cert-type") {
    removeCertificateTypeConfig(Number(actionButton.dataset.certIndex));
  }
  if (action === "add-organization") {
    addOrganizationConfig();
  }
  if (action === "remove-organization") {
    removeOrganizationConfig(Number(actionButton.dataset.orgIndex));
  }
  if (action === "toggle-organization") {
    toggleOrganizationConfig(Number(actionButton.dataset.orgIndex));
  }
  if (action === "add-group") {
    addGroupConfig();
  }
  if (action === "remove-group") {
    removeGroupConfig(Number(actionButton.dataset.groupIndex));
  }
  if (action === "add-group-event") {
    addEventItemToGroup(Number(actionButton.dataset.groupIndex));
  }
  if (action === "remove-group-event") {
    removeEventItemFromGroup(Number(actionButton.dataset.groupIndex), Number(actionButton.dataset.eventIndex));
  }
  if (action === "apply-suggested-birth-range") {
    applySuggestedBirthYearRange(Number(actionButton.dataset.groupIndex));
  }
  if (action === "next-form") {
    submitFormStep();
  }
  if (action === "edit") {
    goToPage("form");
  }
  if (action === "to-payment") {
    submitConfirmation();
  }
  if (action === "pay") {
    payMockOrder();
  }
  if (action === "search-lookup") {
    searchRegistration();
  }
  if (action === "reset") {
    resetForNewRegistration();
    goToPage("form");
  }
  if (action === "mock-file") {
    showToast("V1 仅展示文件入口，暂不下载真实文件");
  }
  if (action === "open-file" || action === "download-file") {
    openConfiguredFile(actionButton.dataset.fileUrl);
  }
  if (action === "close-modal") {
    closeModal();
  }
  if (action === "confirm-modal") {
    const confirmName = actionButton.dataset.confirmName;
    closeModal();
    if (confirmName === "leave-form") goToPage("detail", { replace: true });
    if (confirmName === "new-registration") {
      resetForNewRegistration();
      goToPage("form");
    }
  }
}

function handleInput(eventTarget) {
  const input = eventTarget.target;
  if (input.name === "lookupQuery") {
    uiState.lookupQuery = input.value;
    return;
  }

  if (input.name === "adminUsername" || input.name === "adminPassword") {
    uiState.adminLogin[input.name === "adminUsername" ? "username" : "password"] = input.value;
    uiState.adminLogin.error = "";
    return;
  }

  if (input.name === "adminRegistrationSearch") {
    uiState.adminRegistrationSearch = input.value;
    return;
  }

  if (input.name === "rejectReasonDraft") {
    uiState.rejectReasonDraft = input.value;
    return;
  }

  if (input.matches("[data-admin-banner-field]")) {
    updateBannerDraftFromInput(input, { renderAfter: false });
    return;
  }

  if (input.matches("[data-admin-event-field], [data-admin-rule-field], [data-admin-cert-field], [data-admin-org-field], [data-admin-group-field], [data-admin-event-item-field]")) {
    updateAdminDraftFromInput(input);
    return;
  }

  if (!input.matches("[data-draft-field]")) return;
  updateDraftField(input.name, input.value, { renderAfter: false });
}

function handleChange(eventTarget) {
  const input = eventTarget.target;

  if (input.id === "bannerImageInput") {
    handleBannerImageFile(input.files?.[0]);
    input.value = "";
    return;
  }

  if (input.id === "insuranceInput") {
    handleInsuranceFile(input.files?.[0]);
    return;
  }

  if (input.name === "eventIds") {
    toggleEventSelection(input.value, input.checked);
    return;
  }

  if (input.matches("[data-admin-banner-field]")) {
    updateBannerDraftFromInput(input, { renderAfter: true });
    return;
  }

  if (input.matches("[data-admin-event-field], [data-admin-rule-field], [data-admin-cert-field], [data-admin-org-field], [data-admin-group-field], [data-admin-event-item-field]")) {
    updateAdminDraftFromInput(input);
    render();
    return;
  }

  if (!input.matches("[data-draft-field]")) return;
  updateDraftField(input.name, input.value, { renderAfter: true });
}

function render() {
  headerTitle.textContent = pageTitles[uiState.currentPage] || "赛事报名";
  updateShareMeta();
  uiState.currentStep = getCurrentStep();
  renderProgress();
  renderMoreMenu();
  renderWheelPicker();

  const renderers = {
    detail: renderDetailPage,
    form: renderFormPage,
    confirm: renderConfirmPage,
    payment: renderPaymentPage,
    success: renderSuccessPage,
    registration_lookup: renderLookupPage,
    admin_login: renderAdminLoginPage,
    admin_dashboard: renderAdminDashboardPage,
    admin_registrations: renderAdminRegistrationsPage,
    admin_registration_detail: renderAdminRegistrationDetailPage,
    admin_stats: renderAdminStatsPage,
    admin_config: renderAdminConfigPage,
  };

  const renderer = renderers[uiState.currentPage] || renderDetailPage;
  renderer();
  renderBottomBar();
}

function renderProgress() {
  const shouldShow = ["form", "confirm", "payment", "success"].includes(uiState.currentPage);
  progressSteps.classList.toggle("is-hidden", !shouldShow);

  progressSteps.querySelectorAll(".progress-step").forEach((step) => {
    const stepValue = Number(step.dataset.step);
    step.classList.toggle("is-active", stepValue === uiState.currentStep);
    step.classList.toggle("is-done", stepValue < uiState.currentStep);
  });
}

function renderMoreMenu() {
  const menuButton = document.querySelector("[data-action='toggle-more-menu']");
  if (menuButton) menuButton.setAttribute("aria-expanded", uiState.moreMenuOpen ? "true" : "false");
  if (!moreMenuRoot) return;

  if (!uiState.moreMenuOpen) {
    moreMenuRoot.innerHTML = "";
    return;
  }

  const adminItems = isAdminLoggedIn()
    ? `
      <button type="button" role="menuitem" data-action="menu-go-admin">后台管理</button>
      <button type="button" role="menuitem" data-action="menu-go-admin-config">后台配置</button>
      <button type="button" role="menuitem" data-action="menu-export-approved">导出正式名单 JSON</button>
    `
    : `<button type="button" role="menuitem" data-action="admin-entry">后台登录</button>`;

  moreMenuRoot.innerHTML = `
    <div class="more-menu-backdrop" data-action="close-more-menu" aria-hidden="true"></div>
    <div class="more-menu-panel" role="menu" aria-label="更多操作">
      <button type="button" role="menuitem" data-action="share-event">分享活动</button>
      <button type="button" role="menuitem" data-action="copy-event-link">复制报名链接</button>
      <button type="button" role="menuitem" data-action="menu-go-lookup">查询报名结果</button>
      ${adminItems}
    </div>
  `;
}

function renderWheelPicker() {
  if (!modalRoot) return;
  const picker = uiState.wheelPicker || {};
  if (!picker.open) {
    modalRoot.innerHTML = "";
    return;
  }

  const selectedValue = picker.tempValue || picker.selectedValue || picker.options[0]?.value || "";
  const selectedOption = picker.options.find((item) => item.value === selectedValue) || picker.options[0];
  const title = picker.type === "organization" ? "选择代表单位" : "选择参赛组别";

  modalRoot.innerHTML = `
    <div class="wheel-picker-mask" data-action="close-wheel-picker">
      <section class="wheel-picker-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-action="noop">
        <div class="wheel-picker-toolbar">
          <button type="button" data-action="close-wheel-picker">取消</button>
          <strong>${escapeHtml(title)}</strong>
          <button type="button" data-action="confirm-wheel-picker">确定</button>
        </div>
        <div class="wheel-picker-window">
          <div class="wheel-picker-highlight" aria-hidden="true"></div>
          <div class="wheel-picker-list" role="listbox" aria-activedescendant="wheel-option-${escapeHtml(selectedValue)}">
            ${picker.options
              .map(
                (option) => `
                  <button
                    id="wheel-option-${escapeHtml(option.value)}"
                    class="wheel-picker-option ${option.value === selectedOption?.value ? "is-active" : ""}"
                    type="button"
                    role="option"
                    aria-selected="${option.value === selectedOption?.value ? "true" : "false"}"
                    data-action="select-wheel-option"
                    data-value="${escapeHtml(option.value)}"
                  >
                    ${escapeHtml(option.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
    </div>
  `;

  window.requestAnimationFrame?.(() => {
    modalRoot.querySelector(".wheel-picker-option.is-active")?.scrollIntoView({ block: "center" });
  });
}

function renderBottomBar() {
  bottomBar.className = "bottom-bar";

  if (uiState.currentPage === "detail") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="lookup">查询结果</button>
      <button class="primary-button" type="button" data-action="start">立即报名</button>
    `;
    return;
  }

  if (uiState.currentPage === "form") {
    bottomBar.innerHTML = `<button class="primary-button" type="button" data-action="next-form" ${uiState.isSubmitting ? "disabled" : ""}>下一步</button>`;
    return;
  }

  if (uiState.currentPage === "confirm") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="edit">返回修改</button>
      <button class="primary-button" type="button" data-action="to-payment">确认并去支付</button>
    `;
    return;
  }

  if (uiState.currentPage === "payment") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="edit">返回修改</button>
      <button class="wechat-button" type="button" data-action="pay" ${uiState.isPaying ? "disabled" : ""}>${uiState.isPaying ? "支付处理中..." : "模拟微信支付"}</button>
    `;
    return;
  }

  if (uiState.currentPage === "success") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="home">返回活动详情</button>
      <button class="primary-button" type="button" data-action="reset">重新报名</button>
    `;
    return;
  }

  if (uiState.currentPage === "registration_lookup") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="home">返回详情</button>
      <button class="primary-button" type="button" data-action="search-lookup">查询</button>
    `;
    return;
  }

  if (uiState.currentPage === "admin_login") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="home">返回详情</button>
      <button class="primary-button" type="button" data-action="admin-login">登录</button>
    `;
    return;
  }

  if (uiState.currentPage === "admin_dashboard") {
    bottomBar.innerHTML = `<button class="secondary-button" type="button" data-action="home">返回详情</button>`;
    return;
  }

  if (uiState.currentPage === "admin_registrations") {
    bottomBar.innerHTML = `<button class="secondary-button" type="button" data-action="admin-back-dashboard">返回后台</button>`;
    return;
  }

  if (uiState.currentPage === "admin_stats") {
    bottomBar.innerHTML = `<button class="secondary-button" type="button" data-action="admin-back-dashboard">返回后台</button>`;
    return;
  }

  if (uiState.currentPage === "admin_registration_detail") {
    const selected = getSelectedAdminRegistration();
    const canReview = selected?.record?.status === "pending_review";
    bottomBar.classList.toggle("has-secondary", !canReview);
    bottomBar.classList.toggle("has-tertiary", canReview);
    bottomBar.innerHTML = canReview
      ? `
        <button class="secondary-button" type="button" data-action="admin-back-registrations">返回列表</button>
        <button class="secondary-button danger-button" type="button" data-action="admin-reject-registration">驳回</button>
        <button class="primary-button" type="button" data-action="admin-approve-registration">审核通过</button>
      `
      : `<button class="secondary-button" type="button" data-action="admin-back-registrations">返回列表</button>`;
    return;
  }

  if (uiState.currentPage === "admin_config") {
    bottomBar.classList.add("has-secondary");
    bottomBar.innerHTML = `
      <button class="secondary-button" type="button" data-action="admin-entry">返回后台</button>
      <button class="primary-button" type="button" data-action="save-admin-config">保存配置</button>
    `;
  }
}

function submitFormStep() {
  uiState.isSubmitting = true;
  const valid = validateDraft({ showErrors: true });
  uiState.isSubmitting = false;

  if (!valid) {
    render();
    if (shouldShowIdCardBlockingModal()) {
      showIdCardBlockingModal();
      return;
    }
    showToast(getFirstValidationErrorMessage() || "请完善报名信息");
    return;
  }

  formDraft.status = "draft";
  formDraft.updatedAt = nowIso();
  saveState();
  goToPage("confirm");
}

function submitConfirmation() {
  if (!validateDraft({ showErrors: true })) {
    goToPage("form");
    if (shouldShowIdCardBlockingModal()) {
      showIdCardBlockingModal();
      return;
    }
    showToast(getFirstValidationErrorMessage() || "请先修正报名信息");
    return;
  }
  goToPage("payment");
}

function ensurePendingOrder() {
  if (order.id && order.paymentStatus === "unpaid" && registrationRecord) {
    updatePendingRegistrationSnapshot();
    return;
  }
  createPendingRegistrationAndOrder();
}

function createPendingRegistrationAndOrder() {
  syncDerivedDraftFields();
  const currentEvent = getCurrentEventConfig();
  const registrationNo = formDraft.registrationNo || createRegistrationNo();
  const registrationId = createRegistrationId();
  const createdAt = nowIso();

  registrationRecord = {
    ...clone(formDraft),
    id: registrationId,
    eventId: currentEvent.id,
    registrationNo,
    status: "pending_payment",
    errors: {},
    submittedAt: createdAt,
    updatedAt: createdAt,
  };

  order = {
    id: createOrderId(),
    eventId: currentEvent.id,
    registrationId,
    orderNo: createOrderNo(),
    registrationNo,
    amount: formDraft.totalAmount,
    paymentMethod: "mock_wechat",
    paymentStatus: "unpaid",
    reviewStatus: "pending",
    createdAt,
    paidAt: "",
  };

  formDraft.registrationNo = registrationNo;
  formDraft.status = "pending_payment";
  formDraft.updatedAt = createdAt;
  saveState();
}

function updatePendingRegistrationSnapshot() {
  syncDerivedDraftFields();
  const currentEvent = getCurrentEventConfig();
  registrationRecord = {
    ...clone(formDraft),
    id: registrationRecord.id,
    eventId: currentEvent.id,
    registrationNo: registrationRecord.registrationNo,
    status: "pending_payment",
    errors: {},
    submittedAt: registrationRecord.submittedAt || order.createdAt,
    updatedAt: nowIso(),
  };
  order.amount = formDraft.totalAmount;
  saveState();
}

function payMockOrder() {
  if (uiState.isPaying) return;
  ensurePendingOrder();

  uiState.isPaying = true;
  renderBottomBar();

  window.setTimeout(() => {
    const paidAt = nowIso();
    order.paymentStatus = "paid";
    order.paidAt = paidAt;
    order.reviewStatus = "pending";

    registrationRecord.status = "pending_review";
    registrationRecord.updatedAt = paidAt;
    formDraft.status = "pending_review";
    formDraft.updatedAt = paidAt;

    saveCompletedRegistration();
    uiState.isPaying = false;
    saveState();
    goToPage("success");
  }, 700);
}

function searchRegistration() {
  const query = uiState.lookupQuery.trim();
  uiState.lookupSearched = true;

  if (!query) {
    uiState.lookupResults = [];
    render();
    showToast("请输入手机号、证件号或报名编号");
    return;
  }

  uiState.lookupResults = completedRecords.filter(({ record, order: recordOrder }) => {
    if (recordOrder?.paymentStatus !== "paid") return false;
    if (!lookupStatuses.has(normalizeReviewStatus(record.status))) return false;
    return [record.phone, record.certificateNumber, record.registrationNo]
      .filter(Boolean)
      .some((value) => String(value).includes(query));
  });

  render();
}

function startRegistration() {
  if (formDraft.status === "pending_review" || order.paymentStatus === "paid") {
    openModal({
      title: "已有报名记录",
      message: "当前浏览器已有支付成功的报名记录。重新报名会开启一份新的草稿，但不会清空成功记录。",
      confirmText: "重新报名",
      cancelText: "取消",
      confirmName: "new-registration",
    });
    return;
  }
  goToPage("form");
}

function closeMoreMenu() {
  uiState.moreMenuOpen = false;
  renderMoreMenu();
}

function openWheelPicker(type) {
  const pickerType = type === "organization" ? "organization" : "group";
  const options = getWheelPickerOptions(pickerType);

  if (!options.length) {
    showToast(pickerType === "group" ? "暂无可选组别" : "暂无可选代表单位");
    return;
  }

  const selectedValue = pickerType === "organization" ? formDraft.organizationId : formDraft.groupId;
  uiState.wheelPicker = {
    open: true,
    type: pickerType,
    options,
    selectedValue,
    tempValue: selectedValue || options[0].value,
  };
  renderWheelPicker();
}

function closeWheelPicker() {
  uiState.wheelPicker = {
    open: false,
    type: "",
    options: [],
    selectedValue: "",
    tempValue: "",
  };
  renderWheelPicker();
}

function selectWheelPickerOption(value) {
  if (!uiState.wheelPicker?.open) return;
  uiState.wheelPicker.tempValue = safeText(value);
  renderWheelPicker();
}

function confirmWheelPicker() {
  const picker = uiState.wheelPicker;
  if (!picker?.open) return;

  const value = picker.tempValue || picker.selectedValue || picker.options[0]?.value || "";
  const type = picker.type;
  closeWheelPicker();

  if (!value) return;
  if (type === "organization") {
    updateDraftField("organizationId", value, { renderAfter: true });
    return;
  }
  updateDraftField("groupId", value, { renderAfter: true });
}

function getWheelPickerOptions(type) {
  if (type === "organization") {
    return getEnabledOrganizations().map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }

  if (!formDraft.gender || !formDraft.birthYear) return [];
  return getAvailableGroups(formDraft).map((group) => ({
    value: group.id,
    label: group.name,
  }));
}

async function handleShareEvent() {
  const shareMeta = getShareMetadata();
  const pageUrl = getCurrentPageUrl();

  if (!pageUrl) {
    showToast("当前为本地预览环境，请上线后复制正式报名链接");
    return;
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: shareMeta.title,
        text: shareMeta.description,
        url: pageUrl,
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  handleCopyEventLink();
}

function updateShareMeta() {
  if (typeof document === "undefined") return;
  const shareMeta = getShareMetadata();
  const pageUrl = safeText(window.location?.href).startsWith("file:") ? "" : safeText(window.location?.href);

  document.title = `${shareMeta.title}｜赛事报名`;
  setMetaContent("name", "description", shareMeta.description);
  setMetaContent("property", "og:title", shareMeta.title);
  setMetaContent("property", "og:description", shareMeta.description);
  setMetaContent("property", "og:image", shareMeta.imageUrl);
  setMetaContent("property", "og:image:width", "1200");
  setMetaContent("property", "og:image:height", "630");
  setMetaContent("property", "og:image:alt", shareMeta.title);
  setMetaContent("property", "og:type", "website");
  setMetaContent("property", "og:site_name", "赛事报名系统");
  if (pageUrl) setMetaContent("property", "og:url", pageUrl);
  setMetaContent("name", "twitter:card", "summary_large_image");
  setMetaContent("name", "twitter:title", shareMeta.title);
  setMetaContent("name", "twitter:description", shareMeta.description);
  setMetaContent("name", "twitter:image", shareMeta.imageUrl);
}

function setMetaContent(attributeName, attributeValue, content) {
  if (!attributeName || !attributeValue) return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", safeText(content));
}

async function handleCopyEventLink() {
  const pageUrl = getCurrentPageUrl();
  if (!pageUrl) {
    showToast("当前为本地预览环境，请上线后复制正式报名链接");
    return;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(pageUrl);
    } else {
      copyTextWithFallback(pageUrl);
    }
    showToast("已复制报名链接");
  } catch {
    showToast("复制失败，请手动复制浏览器地址");
  }
}

function getCurrentPageUrl() {
  const href = safeText(window.location?.href).trim();
  if (!href || href.startsWith("file:")) return "";
  return href;
}

function copyTextWithFallback(text) {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  if (!copied) throw new Error("copy failed");
}

function handleBack() {
  if (uiState.currentPage === "detail") return;

  if (uiState.currentPage === "form" && hasDraftContent()) {
    openModal({
      title: "确认退出",
      message: "您还未完成报名，确认退出当前页面？下次进入可继续填写信息。",
      confirmText: "确定",
      cancelText: "取消",
      confirmName: "leave-form",
    });
    return;
  }

  if (uiState.currentPage === "confirm") {
    goToPage("form", { replace: true });
    return;
  }
  if (uiState.currentPage === "payment") {
    goToPage("confirm", { replace: true });
    return;
  }
  if (uiState.currentPage === "admin_registration_detail") {
    goToPage("admin_registrations", { replace: true });
    return;
  }
  if (uiState.currentPage === "admin_registrations" || uiState.currentPage === "admin_stats") {
    goToPage("admin_dashboard", { replace: true });
    return;
  }
  if (uiState.currentPage === "admin_config") {
    goToPage("admin_dashboard", { replace: true });
    return;
  }
  if (uiState.currentPage === "success" || uiState.currentPage === "registration_lookup" || uiState.currentPage === "admin_login" || uiState.currentPage === "admin_dashboard") {
    goToPage("detail", { replace: true });
  }
}

function goToPage(page, options = {}) {
  const requestedPage = page;
  page = preparePageNavigation(page);
  if (page !== "admin_registration_detail") uiState.rejectReasonDraft = "";
  const previousPage = uiState.currentPage;
  uiState.currentPage = page;
  uiState.validationErrors = page === "form" ? uiState.validationErrors : {};
  if (!options.fromHistory) {
    const shouldReplace = options.replace || previousPage === page;
    updateBrowserHistoryState(page, { replace: shouldReplace });
  } else if (requestedPage !== page) {
    replaceBrowserHistoryState(page);
  }
  render();
  saveState();
  scrollAppToTop();
}

function preparePageNavigation(page) {
  const guardedPage = requireAdminAuth(page);
  const nextPage = guardedPage || "detail";
  if (nextPage === "payment") ensurePendingOrder();
  if (nextPage === "admin_config") ensureAdminDraft();
  return nextPage;
}

function getHistoryPage() {
  return window.history?.state?.currentPage || "";
}

function updateBrowserHistoryState(page, options = {}) {
  const historyApi = window.history;
  if (!historyApi?.pushState) return;
  const state = { currentPage: page };
  if (options.replace) {
    historyApi.replaceState(state, "", window.location.href);
    return;
  }
  historyApi.pushState(state, "", window.location.href);
}

function replaceBrowserHistoryState(page) {
  updateBrowserHistoryState(page, { replace: true });
}

function updateDraftField(field, value, options = {}) {
  const before = JSON.stringify(formDraft[field]);
  formDraft[field] = value;
  if (field === "organizationId") {
    const organization = getEnabledOrganizations().find((item) => item.id === value);
    formDraft.organization = organization ? organization.name : "";
  }
  const changed = before !== JSON.stringify(value);

  if (!changed) return;

  if (criticalOrderFields.has(field)) invalidatePendingOrder();
  delete uiState.validationErrors[field];
  delete formDraft.errors[field];

  const autoFilledFromId = handleIdCardValidationAndAutoFill(field);

  if (field === "gender" || field === "birthDate") {
    syncDerivedDraftFields();
    clearInvalidGroupAfterEligibilityChange();
  }

  if (field === "groupId") {
    formDraft.eventIds = [];
    delete uiState.validationErrors.groupId;
    delete formDraft.errors.groupId;
    delete uiState.validationErrors.eventIds;
    delete formDraft.errors.eventIds;
  }

  if (field === "organizationId") {
    delete uiState.validationErrors.organization;
    delete formDraft.errors.organization;
  }

  syncDerivedDraftFields();
  formDraft.updatedAt = nowIso();
  saveState();

  if (options.renderAfter || autoFilledFromId) render();
}

function handleIdCardValidationAndAutoFill(changedField) {
  if (!["certificateType", "certificateNumber"].includes(changedField)) return false;
  if (formDraft.certificateType !== "id_card") {
    uiState.lastAutoParsedIdNumber = "";
    uiState.lastInvalidIdNumber = "";
    clearDraftFieldError("certificateNumber");
    return false;
  }

  const value = formDraft.certificateNumber.trim();
  if (!value) {
    uiState.lastInvalidIdNumber = "";
    clearDraftFieldError("certificateNumber");
    return false;
  }

  const validation = validateChineseIdCard(value);
  if (!validation.valid) {
    const message = validation.reason === "empty" ? "" : validation.message;
    if (message) setDraftFieldError("certificateNumber", message);
    if (validation.reason === "length_short") uiState.lastInvalidIdNumber = "";
    if (value.length >= 18 && uiState.lastInvalidIdNumber !== value) {
      uiState.lastInvalidIdNumber = value;
      showToast("身份证号格式有误，请重新输入");
    }
    return false;
  }

  const previousGender = formDraft.gender;
  const previousBirthDate = formDraft.birthDate;
  formDraft.birthDate = validation.birthDate;
  formDraft.gender = validation.gender;
  uiState.lastInvalidIdNumber = "";
  clearDraftFieldError("certificateNumber");

  const changedAutoFields = previousGender !== formDraft.gender || previousBirthDate !== formDraft.birthDate;
  if (changedAutoFields) {
    invalidatePendingOrder();
    delete uiState.validationErrors.gender;
    delete uiState.validationErrors.birthDate;
    delete formDraft.errors.gender;
    delete formDraft.errors.birthDate;
    syncDerivedDraftFields();
    clearInvalidGroupAfterEligibilityChange();
  }

  if (uiState.lastAutoParsedIdNumber !== formDraft.certificateNumber) {
    uiState.lastAutoParsedIdNumber = formDraft.certificateNumber;
    showToast("已根据身份证号自动识别出生日期和性别");
  }

  return changedAutoFields;
}

function setDraftFieldError(field, message) {
  uiState.validationErrors[field] = message;
  formDraft.errors[field] = message;
  updateLiveFieldError(field, message);
}

function clearDraftFieldError(field) {
  delete uiState.validationErrors[field];
  delete formDraft.errors[field];
  updateLiveFieldError(field, "");
}

function updateLiveFieldError(field, message) {
  const errorNode = document.querySelector(`[data-error-for="${field}"]`);
  if (!errorNode) return;
  errorNode.textContent = message;
  errorNode.classList.toggle("is-empty", !message);
  errorNode.closest(".form-row")?.classList.toggle("has-error", Boolean(message));
}

function toggleEventSelection(eventId, checked) {
  const settings = getCurrentRegistrationSettings();
  const pricingRule = getPricingRule(settings);
  const selected = new Set(formDraft.eventIds);
  if (checked) selected.add(eventId);
  if (!checked) selected.delete(eventId);

  const nextEventIds = Array.from(selected);
  if (nextEventIds.length > pricingRule.maxEventsPerPerson) {
    showToast(`每人最多可报 ${pricingRule.maxEventsPerPerson} 项`);
    render();
    return;
  }

  updateDraftField("eventIds", nextEventIds, { renderAfter: true });
}

function handleInsuranceFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    formDraft.insuranceFile = {
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      previewUrl: file.type.startsWith("image/") ? reader.result : "",
    };
    delete uiState.validationErrors.insuranceFile;
    delete formDraft.errors.insuranceFile;
    formDraft.updatedAt = nowIso();
    saveState();
    render();
  };
  reader.readAsDataURL(file);
}

function invalidatePendingOrder() {
  const hasPendingOrder = Boolean(order.id && order.paymentStatus === "unpaid");
  const hasPendingRecord = registrationRecord?.status === "pending_payment";
  if (!hasPendingOrder && !hasPendingRecord) return;

  order = createEmptyOrder();
  registrationRecord = null;
  formDraft.registrationNo = "";
  formDraft.status = "draft";
  showToast("报名关键信息已变化，旧订单已作废");
}

function validateDraft(options = {}) {
  const showErrors = options.showErrors !== false;
  syncDerivedDraftFields();
  const settings = getCurrentRegistrationSettings();
  const pricingRule = getPricingRule(settings);
  const errors = {};
  const phonePattern = /^1[3-9]\d{9}$/;
  const availableGroups = getAvailableGroups(formDraft);
  const currentGroup = getGroupById(formDraft.groupId);
  const availableEvents = getAvailableEvents(formDraft);
  const validEventIds = new Set(availableEvents.map((item) => item.id));
  const enabledOrganizations = getEnabledOrganizations();
  const selectedOrganization = enabledOrganizations.find((item) => item.id === formDraft.organizationId);

  if (!formDraft.certificateType) errors.certificateType = "请选择证件类型";
  const certificateNumber = formDraft.certificateNumber.trim();
  if (!certificateNumber) {
    errors.certificateNumber = "请输入证件号码";
  } else if (formDraft.certificateType === "id_card") {
    const idCardValidation = validateChineseIdCard(certificateNumber);
    if (!idCardValidation.valid) {
      errors.certificateNumber = "身份证号校验失败，请重新输入后再继续报名";
    }
  }
  if (!formDraft.name.trim()) errors.name = "请输入姓名";
  if (!formDraft.gender) errors.gender = "请选择性别";
  if (!formDraft.birthDate || !formDraft.birthYear) errors.birthDate = "请选择出生日期";
  if (!phonePattern.test(formDraft.phone.trim())) errors.phone = "请输入有效手机号";
  if (!enabledOrganizations.length) {
    errors.organization = "暂无可选代表单位，请联系管理员";
  } else if (!selectedOrganization) {
    errors.organization = "请选择代表单位";
  }

  if (!formDraft.groupId) {
    errors.groupId = "请选择参赛组别";
  } else if (!currentGroup || !availableGroups.some((group) => group.id === formDraft.groupId)) {
    errors.groupId = "参赛组别与性别或出生年份条件不符";
  }

  if (formDraft.eventIds.length < pricingRule.minEventsPerPerson) {
    errors.eventIds = `至少选择 ${pricingRule.minEventsPerPerson} 个参赛项目`;
  } else if (formDraft.eventIds.length > pricingRule.maxEventsPerPerson) {
    errors.eventIds = `每人最多可报 ${pricingRule.maxEventsPerPerson} 项`;
  } else if (formDraft.eventIds.some((id) => !validEventIds.has(id))) {
    errors.eventIds = "参赛项目与当前组别不匹配";
  }

  if (settings.insuranceRequired && !formDraft.insuranceFile) {
    errors.insuranceFile = "请上传保险单";
  }

  if (showErrors) {
    uiState.validationErrors = errors;
    formDraft.errors = errors;
  }

  return Object.keys(errors).length === 0;
}

function shouldShowIdCardBlockingModal() {
  return formDraft.certificateType === "id_card" && Boolean((uiState.validationErrors || {}).certificateNumber) && Boolean(formDraft.certificateNumber.trim());
}

function showIdCardBlockingModal() {
  openModal({
    title: "温馨提示",
    message: "身份证号校验失败，请重新输入后再继续报名",
    cancelText: "知道了",
  });
}

function getFirstValidationErrorMessage() {
  const errorPriority = [
    "certificateType",
    "certificateNumber",
    "name",
    "gender",
    "birthDate",
    "organization",
    "groupId",
    "eventIds",
    "phone",
    "insuranceFile",
  ];
  const errors = uiState.validationErrors || formDraft.errors || {};
  const firstKey = errorPriority.find((key) => errors[key]) || Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : "";
}

function clearInvalidGroupAfterEligibilityChange() {
  if (!formDraft.groupId) return;
  const groups = getAvailableGroups(formDraft);
  const stillValid = groups.some((group) => group.id === formDraft.groupId);
  if (stillValid) return;

  formDraft.groupId = "";
  formDraft.groupName = "";
  formDraft.eventIds = [];
  formDraft.eventNames = [];
  formDraft.totalAmount = 0;
  showToast("已根据性别和出生日期刷新可选组别");
}

function syncDerivedDraftFields() {
  const currentEvent = getCurrentEventConfig();
  const birthYear = parseBirthYear(formDraft.birthDate);
  const competitionYear = parseBirthYear(currentEvent.competitionStartDate);
  formDraft.birthYear = birthYear;
  formDraft.age = birthYear ? competitionYear - birthYear : null;

  const group = getGroupById(formDraft.groupId);
  formDraft.groupName = group ? group.name : "";

  const currentEvents = group ? group.events : [];
  formDraft.eventNames = currentEvents
    .filter((item) => formDraft.eventIds.includes(item.id))
    .map((item) => item.name);
  formDraft.totalAmount = calculateRegistrationAmount(formDraft.eventIds, group);
}

function calculateRegistrationAmount(eventIds, group) {
  const settings = getCurrentRegistrationSettings();
  const pricingRule = getPricingRule(settings);
  const selectedIds = Array.isArray(eventIds) ? eventIds : [];

  if (pricingRule.mode === "tiered") {
    if (!selectedIds.length) return 0;
    if (selectedIds.length <= pricingRule.baseIncludedCount) return pricingRule.basePrice;
    return pricingRule.basePrice + (selectedIds.length - pricingRule.baseIncludedCount) * pricingRule.extraPricePerItem;
  }

  const events = Array.isArray(group?.events) ? group.events : [];
  return events
    .filter((item) => selectedIds.includes(item.id))
    .reduce((total, item) => total + (Number(item.fee) || 0), 0);
}

function getAvailableGroups(draft) {
  const settings = getCurrentRegistrationSettings();
  if (!draft.gender || !draft.birthYear) return [];
  return settings.groups.filter((group) => {
    const genderMatch = group.genderLimit === "all" || group.genderLimit === draft.gender;
    const yearMatch = draft.birthYear >= group.minBirthYear && draft.birthYear <= group.maxBirthYear;
    return genderMatch && yearMatch;
  });
}

function getAvailableEvents(draft) {
  const group = getGroupById(draft.groupId);
  return group ? group.events : [];
}

function getGroupById(groupId) {
  const settings = getCurrentRegistrationSettings();
  return settings.groups.find((group) => group.id === groupId) || null;
}

function resetForNewRegistration() {
  formDraft = createEmptyDraft();
  registrationRecord = null;
  order = createEmptyOrder();
  uiState.validationErrors = {};
  uiState.message = "";
  saveState();
}

function saveCompletedRegistration() {
  if (!registrationRecord || !lookupStatuses.has(registrationRecord.status)) return;

  const nextEntry = {
    record: {
      ...clone(registrationRecord),
      rejectReason: registrationRecord.rejectReason || "",
      reviewedAt: registrationRecord.reviewedAt || "",
    },
    order: clone(order),
  };

  completedRecords = completedRecords.filter((entry) => entry.record.registrationNo !== registrationRecord.registrationNo);
  completedRecords.unshift(nextEntry);
}

function normalizeDraftAfterConfigChange(options = {}) {
  const settings = getCurrentRegistrationSettings();
  const messages = [];
  const finalized = formDraft.status === "pending_review" || order.paymentStatus === "paid";
  if (finalized) return "";

  const firstCertificateType = settings.certificateTypes?.[0]?.value || "";

  if (!settings.certificateTypes.some((item) => item.value === formDraft.certificateType)) {
    formDraft.certificateType = firstCertificateType;
    messages.push("证件类型已按新配置调整");
  }

  const organizationMessage = normalizeOrganizationAfterConfigChange();
  if (organizationMessage) messages.push(organizationMessage);

  syncDerivedDraftFields();

  if (!finalized) {
    const currentGroup = getGroupById(formDraft.groupId);
    const availableGroups = getAvailableGroups(formDraft);
    const groupStillValid = currentGroup && availableGroups.some((group) => group.id === formDraft.groupId);

    if (formDraft.groupId && !groupStillValid) {
      formDraft.groupId = "";
      formDraft.groupName = "";
      formDraft.eventIds = [];
      formDraft.eventNames = [];
      formDraft.totalAmount = 0;
      invalidatePendingOrder();
      messages.push("当前组别已失效，请重新选择");
    } else if (formDraft.groupId) {
      const validEventIds = new Set(getAvailableEvents(formDraft).map((item) => item.id));
      const filteredEventIds = formDraft.eventIds.filter((id) => validEventIds.has(id));
      if (filteredEventIds.length !== formDraft.eventIds.length) {
        formDraft.eventIds = filteredEventIds;
        invalidatePendingOrder();
        messages.push("已清理不再可选的参赛项目");
      }
    }

    const pricingRule = getPricingRule(settings);
    if (formDraft.eventIds.length > pricingRule.maxEventsPerPerson) {
      formDraft.eventIds = formDraft.eventIds.slice(0, pricingRule.maxEventsPerPerson);
      invalidatePendingOrder();
      messages.push("已按新的最大项目数调整选择");
    }
  }

  syncDerivedDraftFields();
  formDraft.eventId = getCurrentEventConfig().id;
  formDraft.updatedAt = nowIso();
  if (!options.silent && messages.length) showToast(messages[0]);
  return messages[0] || "";
}

function normalizeOrganizationAfterConfigChange() {
  const organizations = getEnabledOrganizations();
  const currentId = safeText(formDraft.organizationId);
  const currentName = safeText(formDraft.organization).trim();

  if (!organizations.length) {
    if (currentId) formDraft.organizationId = "";
    return currentName ? "代表单位配置已变化，请重新选择" : "";
  }

  const matchedById = organizations.find((item) => item.id === currentId);
  if (matchedById) {
    formDraft.organization = matchedById.name;
    return "";
  }

  const matchedByName = organizations.find((item) => item.name === currentName);
  if (matchedByName) {
    formDraft.organizationId = matchedByName.id;
    formDraft.organization = matchedByName.name;
    return "";
  }

  if (currentId) formDraft.organizationId = "";
  return currentName ? "代表单位配置已变化，请重新选择" : "";
}

function openConfiguredFile(url) {
  const fileUrl = safeText(url).trim();
  if (!fileUrl || fileUrl === "#") {
    showToast("尚未配置有效文件链接");
    return;
  }
  window.open(fileUrl, "_blank");
}

function scrollAppToTop() {
  if (phoneShell) {
    if (typeof phoneShell.scrollTo === "function") {
      phoneShell.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      phoneShell.scrollTop = 0;
    }
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 1800);
}

function openModal(config) {
  const hasConfirmAction = Boolean(config.confirmName);
  modalRoot.innerHTML = `
    <div class="modal-mask">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle">${escapeHtml(config.title)}</h2>
        <p>${escapeHtml(config.message)}</p>
        <div class="modal-actions ${hasConfirmAction ? "" : "is-single"}">
          <button type="button" data-action="close-modal">${escapeHtml(config.cancelText || "取消")}</button>
          ${
            hasConfirmAction
              ? `<button type="button" data-action="confirm-modal" data-confirm-name="${escapeHtml(config.confirmName)}">${escapeHtml(config.confirmText || "确定")}</button>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
  modalRoot.innerHTML = "";
}
