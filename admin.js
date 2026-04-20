// 后台渲染函数

function renderAdminLoginPage() {
  screen.innerHTML = `
    <article class="admin-auth-page">
      <section class="admin-auth-card">
        <h2>后台登录</h2>
        <label class="admin-config-field">
          <span>用户名</span>
          <input type="text" name="adminUsername" value="${escapeHtml(uiState.adminLogin.username)}" placeholder="请输入用户名" autocomplete="username" />
        </label>
        <label class="admin-config-field">
          <span>密码</span>
          <input type="password" name="adminPassword" value="${escapeHtml(uiState.adminLogin.password)}" placeholder="请输入密码" autocomplete="current-password" />
        </label>
        ${uiState.adminLogin.error ? `<p class="admin-auth-error">${escapeHtml(uiState.adminLogin.error)}</p>` : ""}
      </section>
    </article>
  `;
}

function renderAdminDashboardPage() {
  screen.innerHTML = `
    <article class="admin-dashboard-page">
      <section class="admin-dashboard-card">
        <h2>后台管理</h2>
        <p>本地管理员入口，可审核报名、查看统计、配置规则和导出正式名单。</p>
        <button type="button" data-action="admin-go-registrations">报名审核</button>
        <button type="button" data-action="admin-go-stats">报名统计</button>
        <button type="button" data-action="admin-go-config">后台配置</button>
        <button type="button" data-action="export-approved">导出正式名单 JSON</button>
        <button type="button" data-action="admin-logout">退出登录</button>
      </section>
    </article>
  `;
}

function renderAdminRegistrationsPage() {
  const records = getFilteredAdminRegistrations();
  screen.innerHTML = `
    <article class="admin-management-page">
      <section class="admin-management-card">
        <h2>报名审核</h2>
        <div class="admin-filter-tabs">
          ${adminFilterButton("全部", "all")}
          ${adminFilterButton("待审核", "pending_review")}
          ${adminFilterButton("已通过", "approved")}
          ${adminFilterButton("已驳回", "rejected")}
        </div>
        <div class="admin-search-box">
          <input type="search" name="adminRegistrationSearch" value="${escapeHtml(uiState.adminRegistrationSearch)}" placeholder="姓名 / 手机号 / 证件号 / 报名编号" />
        </div>
      </section>
      <section class="admin-registration-list">
        ${
          records.length
            ? records.map((entry) => renderAdminRegistrationListItem(entry)).join("")
            : `<div class="empty-state">暂无符合条件的已支付报名记录</div>`
        }
      </section>
    </article>
  `;
}

function renderAdminRegistrationListItem(entry) {
  const record = entry.record || {};
  const recordOrder = entry.order || {};
  const canReview = record.status === "pending_review";
  const paymentAmount = getAdminPaymentAmount(record, recordOrder);
  return `
    <div class="admin-registration-item">
      <div class="admin-registration-item-head">
        <strong>${escapeHtml(record.registrationNo || "暂无报名编号")}</strong>
        <span>${escapeHtml(statusLabel(record.status))}</span>
      </div>
      ${plainRow("姓名", record.name)}
      ${plainRow("单位", record.organization)}
      ${plainRow("组别", record.groupName)}
      ${plainRow("项目", normalizeArray(record.eventNames).join("、"))}
      ${plainRow("支付信息", `${paymentStatusLabel(recordOrder.paymentStatus)}｜${formatCurrency(paymentAmount)}`)}
      ${plainRow("审核状态", statusLabel(record.status))}
      <div class="admin-registration-actions">
        <button type="button" data-action="admin-view-registration" data-registration-no="${escapeHtml(record.registrationNo)}">${canReview ? "查看/审核" : "查看详情"}</button>
      </div>
    </div>
  `;
}

function renderAdminRegistrationDetailPage() {
  const selected = getSelectedAdminRegistration();
  if (!selected) {
    const isLoadingRemoteDetail = uiState.remoteDetailLoading && uiState.selectedRegistrationNo;
    screen.innerHTML = `
      <article class="admin-management-page">
        <section class="admin-management-card">
          <h2>报名详情</h2>
          <div class="empty-state">${isLoadingRemoteDetail ? "正在加载报名记录..." : "未找到报名记录"}</div>
        </section>
      </article>
    `;
    return;
  }

  const record = selected.record || {};
  const recordOrder = selected.order || {};
  const canReview = record.status === "pending_review";
  const paymentAmount = getAdminPaymentAmount(record, recordOrder);
  const paidAtText = formatDateTime(recordOrder.paidAt);
  const insuranceContent = record.insuranceFile?.previewUrl
    ? `<img class="readonly-image" src="${record.insuranceFile.previewUrl}" alt="保险单预览" />`
    : escapeHtml(record.insuranceFile?.name || (record.insuranceFile ? "已上传" : "未上传"));

  screen.innerHTML = `
    <article class="admin-management-page">
      <section class="form-section">
        ${readonlyRow("证件类型", certificateTypeLabel(record.certificateType))}
        ${readonlyRow("证件号", record.certificateNumber)}
        ${readonlyRow("姓名", record.name)}
        ${readonlyRow("性别", genderLabel(record.gender))}
        ${readonlyRow("出生日期", record.birthDate)}
        ${readonlyRow("手机号", record.phone)}
        ${readonlyRow("单位", record.organization)}
        ${readonlyRow("组别", record.groupName)}
        ${readonlyRow("项目", normalizeArray(record.eventNames).join("、"))}
        ${readonlyRow("保险单", insuranceContent, true)}
        ${readonlyRow("报名编号", record.registrationNo)}
        ${readonlyRow("订单号", recordOrder.orderNo)}
        ${readonlyRow("支付状态", paymentStatusLabel(recordOrder.paymentStatus))}
        ${readonlyRow("支付金额", formatCurrency(paymentAmount))}
        ${paidAtText ? readonlyRow("支付时间", paidAtText) : ""}
        ${readonlyRow("审核状态", statusLabel(record.status))}
        ${readonlyRow("驳回原因", record.rejectReason || "暂无")}
      </section>
      ${
        canReview
          ? `<section class="admin-management-card">
              <label class="admin-config-field">
                <span>驳回原因</span>
                <textarea name="rejectReasonDraft" rows="3" placeholder="驳回时必填，至少 2 个字">${escapeHtml(uiState.rejectReasonDraft)}</textarea>
              </label>
            </section>`
          : `<section class="admin-management-card"><p class="admin-status-note">${escapeHtml(record.status === "approved" ? "该报名已审核通过，不支持反向操作。" : "该报名已驳回，不支持恢复操作。")}</p></section>`
      }
    </article>
  `;
}

function renderAdminStatsPage() {
  const stats = getRegistrationStats();
  screen.innerHTML = `
    <article class="admin-management-page">
      <section class="admin-stats-grid">
        ${statCard("总报名数", stats.total)}
        ${statCard("已支付数", stats.paid)}
        ${statCard("待审核数", stats.pendingReview)}
        ${statCard("已通过数", stats.approved)}
        ${statCard("已驳回数", stats.rejected)}
      </section>
      <section class="admin-management-card">
        <h2>各组别人数统计</h2>
        ${renderStatsRows(stats.groupCounts, "暂无组别统计")}
      </section>
      <section class="admin-management-card">
        <h2>各项目人数统计</h2>
        ${renderStatsRows(stats.eventCounts, "暂无项目统计")}
      </section>
    </article>
  `;
}

function renderAdminConfigPage() {
  ensureAdminDraft();
  screen.innerHTML = `
    <article class="admin-config-page">
      ${renderEventConfigSection()}
      ${renderBannerConfigSection()}
      ${renderShareCardConfigSection()}
      ${renderFileConfigSection()}
      ${renderRuleConfigSection()}
      ${renderOrganizationConfigSection()}
      ${renderGroupConfigSection()}
      <section class="admin-config-section">
        <h2>配置操作</h2>
        <p class="admin-config-note">保存后会立即影响前台报名规则。已有成功报名记录不会被改写。</p>
        <button class="admin-config-danger" type="button" data-action="reset-admin-config">恢复默认配置</button>
      </section>
    </article>
  `;
}

function renderEventConfigSection() {
  const current = adminDraft.eventConfig;
  return `
    <section class="admin-config-section">
      <h2>赛事基础信息</h2>
      ${adminInput("赛事名称", "name", current.name, "text", "data-admin-event-field")}
      ${adminInput("报名开始日期", "registrationStartDate", current.registrationStartDate, "date", "data-admin-event-field")}
      ${adminInput("报名截止日期", "registrationEndDate", current.registrationEndDate, "date", "data-admin-event-field")}
      ${adminInput("比赛开始日期", "competitionStartDate", current.competitionStartDate, "date", "data-admin-event-field")}
      ${adminInput("比赛结束日期", "competitionEndDate", current.competitionEndDate, "date", "data-admin-event-field")}
      ${adminInput("比赛地点", "location", current.location, "text", "data-admin-event-field")}
    </section>
  `;
}

function renderShareCardConfigSection() {
  const current = adminDraft.eventConfig || {};
  const shareCard = sanitizeShareCard(current.shareCard);
  const preview = getShareMetadata(current);
  return `
    <section class="admin-config-section">
      <h2>分享卡片设置</h2>
      <p class="admin-config-note">用于微信/聊天中展示报名链接。留空时会自动使用赛事名称、报名时间和默认缩略图。</p>
      ${adminInput("分享标题", "shareCard.title", shareCard.title, "text", "data-admin-event-field", "placeholder=\"默认使用赛事名称\"")}
      <label class="admin-config-field admin-config-textarea">
        <span>分享描述</span>
        <textarea data-admin-event-field="shareCard.description" rows="3" placeholder="默认生成：报名中｜04.16 - 05.06｜点击进入报名通道">${escapeHtml(shareCard.description)}</textarea>
      </label>
      ${adminInput("分享图片地址（可选）", "shareCard.imageUrl", shareCard.imageUrl, "url", "data-admin-event-field", "placeholder=\"可填写适合聊天卡片的图片 URL\"")}
      <div class="admin-config-share-preview">
        <div class="admin-config-share-image">
          <img src="${escapeHtml(preview.imageUrl)}" alt="分享图片预览" onerror="this.parentElement.classList.add('is-error'); this.remove();" />
        </div>
        <div>
          <strong>${escapeHtml(preview.title)}</strong>
          <p>${escapeHtml(preview.description)}</p>
        </div>
      </div>
    </section>
  `;
}

function renderBannerConfigSection() {
  const bannerImage = normalizeBannerDraft(adminDraft.eventConfig.bannerImage);
  const sourceMode = getBannerSourceMode(bannerImage);
  const uploadPreviewUrl = sourceMode === "upload" ? bannerImage.url : "";
  const urlPreviewUrl = sourceMode === "url" ? bannerImage.sourceUrl || bannerImage.url : "";
  const hasUpload = sourceMode === "upload" && Boolean(uploadPreviewUrl);
  const hasUrlPreview = sourceMode === "url" && Boolean(urlPreviewUrl);
  const fitMode = getBannerFitMode(bannerImage);
  const previewFitClass = getBannerFitClass(fitMode, "admin-config-banner-preview-image");
  return `
    <section class="admin-config-section">
      <h2>活动 Banner 图</h2>
      <label class="admin-config-field">
        <span>图片显示方式</span>
        <select data-admin-banner-field="fitMode">
          ${adminOption("cover", "封面裁切", fitMode)}
          ${adminOption("contain", "完整显示", fitMode)}
        </select>
      </label>
      <div class="admin-config-banner-mode">
        <label>
          <input type="radio" name="bannerMode" value="upload" data-admin-banner-field="mode" ${sourceMode === "upload" ? "checked" : ""} />
          <span>上传图片</span>
        </label>
        <label>
          <input type="radio" name="bannerMode" value="url" data-admin-banner-field="mode" ${sourceMode === "url" ? "checked" : ""} />
          <span>图片地址</span>
        </label>
      </div>
      ${
        sourceMode === "url"
          ? `
            <label class="admin-config-field">
              <span>图片地址</span>
              <input type="url" value="${escapeHtml(bannerImage.sourceUrl || "")}" placeholder="请输入 https:// 开头的图片地址" data-admin-banner-field="sourceUrl" />
            </label>
            <div class="admin-config-banner-preview ${hasUrlPreview ? "" : "is-empty"}">
              <img id="bannerUrlPreviewImage" class="${previewFitClass} ${hasUrlPreview ? "" : "is-hidden"}" src="${escapeHtml(urlPreviewUrl)}" alt="图片地址预览" />
              ${hasUrlPreview ? "" : `<span>输入图片地址后将在这里预览</span>`}
            </div>
            <p id="bannerUrlStatus" class="admin-config-banner-status ${getBannerUrlStatusClass(bannerImage)}">${escapeHtml(getBannerUrlStatusText(bannerImage))}</p>
            <div class="admin-config-banner-actions">
              <button class="admin-config-danger-line" type="button" data-action="clear-banner-url">清空地址</button>
            </div>
            <p class="admin-config-note">保存前会校验该地址能否作为图片正常加载，普通网页地址不会被保存为 banner。</p>
          `
          : `
            <div class="admin-config-banner-preview ${hasUpload ? "" : "is-empty"}">
              ${
                hasUpload
                  ? `<img class="${previewFitClass}" src="${escapeHtml(uploadPreviewUrl)}" alt="${escapeHtml(bannerImage.name || "活动 banner")}" onerror="this.remove()" />`
                  : `<span>未上传 banner，前台将显示默认渐变背景</span>`
              }
            </div>
            <div class="admin-config-banner-actions">
              <label class="admin-config-upload-button" for="bannerImageInput">${hasUpload ? "替换图片" : "上传图片"}</label>
              <input id="bannerImageInput" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" />
              ${
                hasUpload
                  ? `<button class="admin-config-danger-line" type="button" data-action="remove-banner-image">删除图片</button>`
                  : ""
              }
            </div>
            <p class="admin-config-note">支持 JPG / PNG / WEBP。单张原图不超过 ${formatFileSize(maxBannerUploadBytes)}，保存前会压缩到适合本地存储的尺寸和体积。</p>
            ${hasUpload ? `<p class="admin-config-note">当前图片：${escapeHtml(bannerImage.name || "未命名")}，${formatFileSize(bannerImage.size)}</p>` : ""}
          `
      }
    </section>
  `;
}

function renderFileConfigSection() {
  const current = adminDraft.eventConfig;
  const descriptionText = normalizeArray(current.description).join("\n");
  return `
    <section class="admin-config-section">
      <h2>文件和说明</h2>
      ${adminInput("竞赛规程名称", "regulationFile.name", current.regulationFile?.name, "text", "data-admin-event-field")}
      ${adminInput("竞赛规程链接", "regulationFile.url", current.regulationFile?.url, "text", "data-admin-event-field")}
      ${adminInput("承诺书名称", "commitmentFile.name", current.commitmentFile?.name, "text", "data-admin-event-field")}
      ${adminInput("承诺书链接", "commitmentFile.url", current.commitmentFile?.url, "text", "data-admin-event-field")}
      <label class="admin-config-field admin-config-textarea">
        <span>活动详情</span>
        <textarea data-admin-event-field="descriptionText" rows="6">${escapeHtml(descriptionText)}</textarea>
      </label>
    </section>
  `;
}

function renderRuleConfigSection() {
  const settings = adminDraft.registrationConfig;
  const pricingRule = settings.pricingRule || getDefaultPricingRule(settings);
  return `
    <section class="admin-config-section">
      <h2>报名规则</h2>
      ${adminInput("最少报名项目数", "pricingRule.minEventsPerPerson", pricingRule.minEventsPerPerson, "number", "data-admin-rule-field", "min=\"1\"")}
      ${adminInput("最多报名项目数", "pricingRule.maxEventsPerPerson", pricingRule.maxEventsPerPerson, "number", "data-admin-rule-field", "min=\"1\"")}
      <label class="admin-config-field">
        <span>收费模式</span>
        <select data-admin-rule-field="pricingRule.mode">
          ${adminOption("itemized", "按项目单价", pricingRule.mode)}
          ${adminOption("tiered", "按数量阶梯收费", pricingRule.mode)}
        </select>
      </label>
      ${adminInput("基础包含项目数", "pricingRule.baseIncludedCount", pricingRule.baseIncludedCount, "number", "data-admin-rule-field", "min=\"1\"")}
      ${adminInput("基础价格", "pricingRule.basePrice", pricingRule.basePrice, "number", "data-admin-rule-field", "min=\"0\"")}
      ${adminInput("超出每项加价", "pricingRule.extraPricePerItem", pricingRule.extraPricePerItem, "number", "data-admin-rule-field", "min=\"0\"")}
      <label class="admin-config-switch">
        <span>必须上传保险单</span>
        <input type="checkbox" data-admin-rule-field="insuranceRequired" ${settings.insuranceRequired ? "checked" : ""} />
      </label>
      <div class="admin-config-subhead">
        <h3>证件类型</h3>
        <button type="button" data-action="add-cert-type">新增</button>
      </div>
      <div class="admin-config-list">
        ${settings.certificateTypes.map((item, index) => renderCertificateTypeRow(item, index)).join("")}
      </div>
    </section>
  `;
}

function renderCertificateTypeRow(item, index) {
  return `
    <div class="admin-config-cert-row">
      <label>
        <span>证件名称</span>
        <input type="text" value="${escapeHtml(item.label)}" placeholder="请输入证件名称" data-admin-cert-index="${index}" data-admin-cert-field="label" />
      </label>
      <button type="button" data-action="remove-cert-type" data-cert-index="${index}" aria-label="删除证件类型">删除</button>
      <details class="admin-config-advanced admin-config-cert-advanced">
        <summary>高级选项</summary>
        <label class="admin-config-field">
          <span>技术 value（保存时自动生成）</span>
          <input type="text" value="${escapeHtml(item.value || "保存后生成")}" readonly />
        </label>
      </details>
    </div>
  `;
}

function renderOrganizationConfigSection() {
  const organizations = adminDraft.registrationConfig.organizations || [];
  return `
    <section class="admin-config-section">
      <div class="admin-config-subhead">
        <h2>代表单位配置</h2>
        <button type="button" data-action="add-organization">新增单位</button>
      </div>
      <p class="admin-config-note">前台报名只能从已启用单位中选择，单位 ID 保存时会自动生成。</p>
      <div class="admin-config-list">
        ${
          organizations.length
            ? organizations.map((item, index) => renderOrganizationConfigRow(item, index)).join("")
            : `<div class="empty-state">暂无代表单位，请先新增</div>`
        }
      </div>
    </section>
  `;
}

function renderOrganizationConfigRow(item, index) {
  return `
    <div class="admin-config-org-row">
      <label>
        <span>单位名称</span>
        <input type="text" value="${escapeHtml(item.name)}" placeholder="请输入代表单位名称" data-admin-org-index="${index}" data-admin-org-field="name" />
      </label>
      <label class="admin-config-org-switch">
        <input type="checkbox" data-admin-org-index="${index}" data-admin-org-field="enabled" ${item.enabled ? "checked" : ""} />
        <span>启用</span>
      </label>
      <button type="button" data-action="remove-organization" data-org-index="${index}">删除</button>
      <details class="admin-config-advanced admin-config-org-advanced">
        <summary>高级选项</summary>
        <label class="admin-config-field">
          <span>单位 ID（保存时自动生成）</span>
          <input type="text" value="${escapeHtml(item.id || "保存后生成")}" readonly />
        </label>
      </details>
    </div>
  `;
}

function renderGroupConfigSection() {
  const groups = adminDraft.registrationConfig.groups || [];
  return `
    <section class="admin-config-section">
      <div class="admin-config-subhead">
        <h2>组别配置</h2>
        <button type="button" data-action="add-group">新增组别</button>
      </div>
      <div class="admin-config-groups">
        ${groups.map((group, groupIndex) => renderGroupConfigCard(group, groupIndex)).join("")}
      </div>
    </section>
  `;
}

function renderGroupConfigCard(group, groupIndex) {
  return `
    <section class="admin-config-group-card">
      <div class="admin-config-group-title">
        <h3>${escapeHtml(group.name || `组别 ${groupIndex + 1}`)}</h3>
        <button type="button" data-action="remove-group" data-group-index="${groupIndex}">删除组别</button>
      </div>
      ${adminGroupInput("name", group.name, groupIndex, "text", "组别名称")}
      <label class="admin-config-field">
        <span>性别限制</span>
        <select data-admin-group-index="${groupIndex}" data-admin-group-field="genderLimit">
          ${adminOption("male", "男", group.genderLimit)}
          ${adminOption("female", "女", group.genderLimit)}
          ${adminOption("all", "不限", group.genderLimit)}
        </select>
      </label>
      ${adminGroupInput("minBirthYear", group.minBirthYear, groupIndex, "number", "最小出生年")}
      ${adminGroupInput("maxBirthYear", group.maxBirthYear, groupIndex, "number", "最大出生年")}
      ${renderSuggestedBirthYearRange(group, groupIndex)}
      <div class="admin-config-subhead admin-config-event-head">
        <h4>项目配置</h4>
        <button type="button" data-action="add-group-event" data-group-index="${groupIndex}">新增项目</button>
      </div>
      <div class="admin-config-events">
        ${(group.events || []).map((item, eventIndex) => renderGroupEventRow(item, groupIndex, eventIndex)).join("")}
      </div>
      ${renderGroupAdvancedOptions(group, groupIndex)}
    </section>
  `;
}

function renderSuggestedBirthYearRange(group, groupIndex) {
  const suggestion = getSuggestedBirthYearRange(group?.name, adminDraft?.eventConfig?.competitionStartDate);

  if (!suggestion) {
    return `
      <div class="admin-config-suggestion">
        <p>未识别到标准 U 组名称，无法自动推算建议范围</p>
      </div>
    `;
  }

  return `
    <div class="admin-config-suggestion">
      <strong>建议范围（按比赛年份自动推算）</strong>
      <span>比赛年份：${suggestion.competitionYear}</span>
      <span>识别组别：${escapeHtml(suggestion.groupCode)}</span>
      <span>建议年龄：${suggestion.minAge} - ${suggestion.maxAge} 岁</span>
      <span>建议出生年份：${suggestion.minBirthYear} - ${suggestion.maxBirthYear}</span>
      <button class="admin-config-suggestion-button" type="button" data-action="apply-suggested-birth-range" data-group-index="${groupIndex}">按建议填充</button>
    </div>
  `;
}

function renderGroupEventRow(item, groupIndex, eventIndex) {
  return `
    <div class="admin-config-event-row">
      <label>
        <span>项目名称</span>
        <input type="text" value="${escapeHtml(item.name)}" placeholder="请输入项目名称" data-admin-group-index="${groupIndex}" data-admin-event-index="${eventIndex}" data-admin-event-item-field="name" />
      </label>
      <label>
        <span>费用（元）</span>
        <input type="number" min="0" value="${escapeHtml(item.fee)}" placeholder="请输入费用（元）" data-admin-group-index="${groupIndex}" data-admin-event-index="${eventIndex}" data-admin-event-item-field="fee" />
      </label>
      <button type="button" data-action="remove-group-event" data-group-index="${groupIndex}" data-event-index="${eventIndex}">删除</button>
    </div>
  `;
}

function renderGroupAdvancedOptions(group, groupIndex) {
  return `
    <details class="admin-config-advanced">
      <summary>高级选项</summary>
      <label class="admin-config-field">
        <span>组别 ID（保存时自动生成）</span>
        <input type="text" value="${escapeHtml(group.id || "保存后生成")}" readonly />
      </label>
      <div class="admin-config-advanced-list">
        ${(group.events || [])
          .map(
            (item, eventIndex) => `
              <label class="admin-config-field">
                <span>项目 ${eventIndex + 1} ID（保存时自动生成）</span>
                <input type="text" value="${escapeHtml(item.id || "保存后生成")}" readonly />
              </label>
            `,
          )
          .join("")}
      </div>
      <p>技术 ID 会根据名称自动生成并去重，通常无需手动维护。</p>
    </details>
  `;
}

function adminFilterButton(label, value) {
  const active = uiState.adminRegistrationFilter === value;
  return `<button class="${active ? "is-active" : ""}" type="button" data-action="admin-filter-registrations" data-filter="${value}">${escapeHtml(label)}</button>`;
}

function getAdminPaymentAmount(record, recordOrder) {
  return Number(recordOrder?.amount ?? record?.totalAmount ?? 0) || 0;
}

function statCard(label, value) {
  return `
    <div class="admin-stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${Number(value || 0)}</strong>
    </div>
  `;
}

function renderStatsRows(counts, emptyText) {
  const rows = Object.entries(counts || {}).sort((a, b) => safeText(a[0]).localeCompare(safeText(b[0]), "zh-CN"));
  if (!rows.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  return `
    <div class="admin-stats-list">
      ${rows.map(([name, count]) => `<div><span>${escapeHtml(name)}</span><strong>${count}</strong></div>`).join("")}
    </div>
  `;
}

function adminInput(label, field, value, type, dataAttr, extraAttrs = "") {
  return `
    <label class="admin-config-field">
      <span>${escapeHtml(label)}</span>
      <input type="${type}" value="${escapeHtml(value || "")}" ${dataAttr}="${escapeHtml(field)}" ${extraAttrs} />
    </label>
  `;
}

function adminGroupInput(field, value, groupIndex, type, label) {
  return `
    <label class="admin-config-field">
      <span>${escapeHtml(label)}</span>
      <input type="${type}" value="${escapeHtml(value || "")}" data-admin-group-index="${groupIndex}" data-admin-group-field="${escapeHtml(field)}" />
    </label>
  `;
}

function adminOption(value, label, selectedValue) {
  return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function readAdminInputValue(input) {
  if (input.type === "number") {
    return input.value === "" ? "" : Number(input.value);
  }
  return input.value;
}

// 后台业务动作函数

function requireAdminAuth(targetPage) {
  const protectedPages = new Set(["admin_dashboard", "admin_registrations", "admin_registration_detail", "admin_stats", "admin_config"]);
  if (!protectedPages.has(targetPage)) return targetPage;
  return isAdminLoggedIn() ? targetPage : "admin_login";
}

function handleAdminLogin() {
  const username = uiState.adminLogin.username.trim();
  const password = uiState.adminLogin.password;

  if (username === "admin" && password === "123456") {
    adminAuth = { isLoggedIn: true };
    saveAdminAuth();
    uiState.adminLogin = { username: "", password: "", error: "" };
    showToast("登录成功");
    goToPage("admin_dashboard");
    return;
  }

  uiState.adminLogin.error = "用户名或密码错误";
  render();
}

function handleAdminLogout() {
  clearAdminAuth();
  adminDraft = null;
  closeMoreMenu();
  showToast("已退出登录");
  goToPage("detail");
}

function getPaidCompletedRecords() {
  return completedRecords.filter((entry) => entry?.order?.paymentStatus === "paid");
}

function getAdminRegistrationEntries() {
  return uiState.remoteAdminLoaded ? remoteRegistrations : getPaidCompletedRecords();
}

function getFilteredAdminRegistrations() {
  const filter = uiState.adminRegistrationFilter;
  const query = uiState.adminRegistrationSearch.trim();
  return getAdminRegistrationEntries().filter(({ record }) => {
    if (!record) return false;
    const statusMatch = filter === "all" || record.status === filter;
    const queryMatch =
      !query ||
      [record.name, record.phone, record.certificateNumber, record.registrationNo]
        .filter(Boolean)
        .some((value) => String(value).includes(query));
    return statusMatch && queryMatch;
  });
}

function getSelectedAdminRegistration() {
  if (!uiState.selectedRegistrationNo) return null;
  const selectedNo = safeText(uiState.selectedRegistrationNo);
  return (
    remoteRegistrations.find((entry) => safeText(entry?.record?.registrationNo) === selectedNo) ||
    completedRecords.find((entry) => safeText(entry?.record?.registrationNo) === selectedNo) ||
    null
  );
}

async function openAdminRegistrationDetail(registrationNo) {
  uiState.selectedRegistrationNo = safeText(registrationNo).trim();
  const selected = getSelectedAdminRegistration();
  uiState.rejectReasonDraft = selected?.record?.rejectReason || "";
  uiState.remoteDetailMissRegistrationNo = "";
  uiState.remoteDetailLoading = Boolean(!selected && uiState.selectedRegistrationNo && isRemoteEnabled());
  goToPage("admin_registration_detail");
  if (uiState.remoteDetailLoading) await loadSelectedRemoteRegistrationDetail(uiState.selectedRegistrationNo);
}

async function loadSelectedRemoteRegistrationDetail(registrationNo) {
  try {
    const remoteEntry = await loadRemoteRegistrationDetail(registrationNo);
    if (remoteEntry) {
      upsertRemoteRegistrationEntry(remoteEntry);
      upsertLocalCompletedEntry(remoteEntry);
      uiState.remoteAdminLoaded = true;
      uiState.remoteDetailMissRegistrationNo = "";
      uiState.rejectReasonDraft = remoteEntry.record?.rejectReason || "";
      return;
    }
    uiState.remoteDetailMissRegistrationNo = safeText(registrationNo);
  } catch (error) {
    console.warn("loadRemoteRegistrationDetail failed", error);
  } finally {
    uiState.remoteDetailLoading = false;
    render();
  }
}

async function approveRegistration(registrationNo) {
  const entry = getSelectedAdminRegistration();
  if (!entry || entry.record.status !== "pending_review" || entry.order?.paymentStatus !== "paid") {
    showToast("当前报名不可审核");
    return;
  }

  const reviewedAt = nowIso();
  try {
    const remoteEntry = await reviewRemoteRegistration(registrationNo, "approved", "");
    if (remoteEntry) {
      upsertRemoteRegistrationEntry(remoteEntry);
      upsertLocalCompletedEntry(remoteEntry);
      syncReviewedRecordToActiveState(remoteEntry.record);
      saveState();
      showToast("已审核通过");
      render();
      return;
    }
  } catch (error) {
    console.warn("reviewRemoteRegistration approved failed", error);
  }

  entry.record.status = "approved";
  entry.record.reviewedAt = reviewedAt;
  entry.record.rejectReason = "";
  syncReviewedRecordToActiveState(entry.record);
  saveState();
  showToast("已审核通过");
  render();
}

async function rejectRegistration(registrationNo, reason) {
  const entry = getSelectedAdminRegistration();
  const rejectReason = safeText(reason).trim();
  if (!entry || entry.record.status !== "pending_review" || entry.order?.paymentStatus !== "paid") {
    showToast("当前报名不可驳回");
    return;
  }
  if (rejectReason.length < 2) {
    showToast("请填写至少 2 个字的驳回原因");
    return;
  }

  const reviewedAt = nowIso();
  try {
    const remoteEntry = await reviewRemoteRegistration(registrationNo, "rejected", rejectReason);
    if (remoteEntry) {
      upsertRemoteRegistrationEntry(remoteEntry);
      upsertLocalCompletedEntry(remoteEntry);
      syncReviewedRecordToActiveState(remoteEntry.record);
      saveState();
      showToast("已驳回报名");
      render();
      return;
    }
  } catch (error) {
    console.warn("reviewRemoteRegistration rejected failed", error);
  }

  entry.record.status = "rejected";
  entry.record.reviewedAt = reviewedAt;
  entry.record.rejectReason = rejectReason;
  syncReviewedRecordToActiveState(entry.record);
  saveState();
  showToast("已驳回报名");
  render();
}

function syncReviewedRecordToActiveState(record) {
  if (!registrationRecord || registrationRecord.registrationNo !== record.registrationNo) return;
  registrationRecord.status = record.status;
  registrationRecord.reviewedAt = record.reviewedAt || "";
  registrationRecord.rejectReason = record.rejectReason || "";
  formDraft.status = record.status;
  formDraft.updatedAt = nowIso();
}

function upsertRemoteRegistrationEntry(entry) {
  if (!entry?.record?.registrationNo) return;
  remoteRegistrations = remoteRegistrations.filter((item) => item?.record?.registrationNo !== entry.record.registrationNo);
  remoteRegistrations.unshift(entry);
}

function upsertLocalCompletedEntry(entry) {
  if (!entry?.record?.registrationNo) return;
  completedRecords = completedRecords.filter((item) => item?.record?.registrationNo !== entry.record.registrationNo);
  completedRecords.unshift(entry);
}

function getRegistrationStats() {
  const sourceRecords = getAdminRegistrationEntries();
  const paidRecords = sourceRecords.filter((entry) => entry?.order?.paymentStatus === "paid");
  const groupCounts = {};
  const eventCounts = {};

  sourceRecords.forEach(({ record }) => {
    const groupName = safeText(record?.groupName || "未分组");
    groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
    normalizeArray(record?.eventNames).forEach((eventName) => {
      eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
    });
  });

  return {
    total: sourceRecords.length,
    paid: paidRecords.length,
    pendingReview: paidRecords.filter(({ record }) => record?.status === "pending_review").length,
    approved: paidRecords.filter(({ record }) => record?.status === "approved").length,
    rejected: paidRecords.filter(({ record }) => record?.status === "rejected").length,
    groupCounts,
    eventCounts,
  };
}

function exportApprovedRegistrationsJson() {
  const currentEvent = getCurrentEventConfig();
  const exportData = buildApprovedRegistrationsExport();
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `approved-registrations-${currentEvent.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast(`已导出 ${exportData.registrations.length} 条正式名单`);
  return exportData;
}

function buildApprovedRegistrationsExport() {
  const currentEvent = getCurrentEventConfig();
  const registrations = completedRecords
    .filter(({ record, order: recordOrder }) => {
      const status = record?.status || "";
      const paymentStatus = recordOrder?.paymentStatus || "";
      return status === "approved" && paymentStatus === "paid";
    })
    .map(({ record, order: recordOrder }) => {
      const eventIds = normalizeArray(record.eventIds);
      const eventNames = normalizeArray(record.eventNames);

      return {
        registrationNo: safeText(record.registrationNo),
        name: safeText(record.name),
        gender: safeText(record.gender),
        genderLabel: genderLabel(record.gender),
        birthDate: safeText(record.birthDate),
        birthYear: Number(record.birthYear) || null,
        phone: safeText(record.phone),
        teamName: safeText(record.organization),
        groupId: safeText(record.groupId),
        groupName: safeText(record.groupName),
        eventIds,
        eventNames,
        certificateType: safeText(record.certificateType),
        certificateNumber: safeText(record.certificateNumber),
        status: safeText(record.status),
        paidAt: safeText(recordOrder.paidAt),
        paymentStatus: safeText(recordOrder.paymentStatus),
        orderNo: safeText(recordOrder.orderNo),
        insuranceUploaded: Boolean(record.insuranceFile),
      };
    })
    .sort(sortExportRegistration);

  return {
    schemaVersion: "registration-export-v1",
    event: {
      id: currentEvent.id,
      name: currentEvent.name,
      competitionStartDate: currentEvent.competitionStartDate,
      competitionEndDate: currentEvent.competitionEndDate,
    },
    generatedAt: nowIso(),
    registrations,
  };
}

function sortExportRegistration(a, b) {
  const groupCompare = safeText(a.groupName).localeCompare(safeText(b.groupName), "zh-CN");
  if (groupCompare !== 0) return groupCompare;

  const firstEventCompare = safeText(a.eventNames[0]).localeCompare(safeText(b.eventNames[0]), "zh-CN");
  if (firstEventCompare !== 0) return firstEventCompare;

  return safeText(a.name).localeCompare(safeText(b.name), "zh-CN");
}

function openAdminConfigPage() {
  adminDraft = createAdminDraftFromCurrent();
  goToPage("admin_config");
}

function ensureAdminDraft() {
  if (!adminDraft) adminDraft = createAdminDraftFromCurrent();
}

function createAdminDraftFromCurrent() {
  const registrationConfig = clone(getCurrentRegistrationSettings());
  registrationConfig.certificateTypes = registrationConfig.certificateTypes.map((item) => ({
    ...item,
    _originalLabel: item.label,
    _originalValue: item.value,
  }));
  registrationConfig.organizations = (Array.isArray(registrationConfig.organizations) ? registrationConfig.organizations : []).map((item) => ({
    ...item,
    _originalName: item.name,
    _originalId: item.id,
  }));
  return {
    eventConfig: clone(getCurrentEventConfig()),
    registrationConfig,
  };
}

function updateAdminDraftFromInput(input) {
  ensureAdminDraft();

  if (input.dataset.adminEventField) {
    const field = input.dataset.adminEventField;
    if (field === "descriptionText") {
      adminDraft.eventConfig.description = input.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      return;
    }
    setByPath(adminDraft.eventConfig, field, input.value);
    return;
  }

  if (input.dataset.adminRuleField) {
    const field = input.dataset.adminRuleField;
    if (field === "insuranceRequired") {
      adminDraft.registrationConfig[field] = input.checked;
    } else {
      setByPath(adminDraft.registrationConfig, field, readAdminInputValue(input));
    }
    return;
  }

  if (input.dataset.adminCertField) {
    const index = Number(input.dataset.adminCertIndex);
    const field = input.dataset.adminCertField;
    if (!adminDraft.registrationConfig.certificateTypes[index]) return;
    adminDraft.registrationConfig.certificateTypes[index][field] = input.value;
    return;
  }

  if (input.dataset.adminOrgField) {
    const index = Number(input.dataset.adminOrgIndex);
    const field = input.dataset.adminOrgField;
    if (!adminDraft.registrationConfig.organizations[index]) return;
    adminDraft.registrationConfig.organizations[index][field] = field === "enabled" ? input.checked : input.value;
    return;
  }

  if (input.dataset.adminGroupField) {
    const groupIndex = Number(input.dataset.adminGroupIndex);
    const field = input.dataset.adminGroupField;
    const group = adminDraft.registrationConfig.groups[groupIndex];
    if (!group) return;
    group[field] = readAdminInputValue(input);
    return;
  }

  if (input.dataset.adminEventItemField) {
    const groupIndex = Number(input.dataset.adminGroupIndex);
    const eventIndex = Number(input.dataset.adminEventIndex);
    const field = input.dataset.adminEventItemField;
    const item = adminDraft.registrationConfig.groups[groupIndex]?.events?.[eventIndex];
    if (!item) return;
    item[field] = readAdminInputValue(input);
  }
}

async function handleBannerImageFile(file) {
  ensureAdminDraft();
  if (!file) return;

  if (!supportedBannerTypes.has(file.type)) {
    showToast("请上传 JPG、PNG 或 WEBP 图片");
    return;
  }

  if (file.size > maxBannerUploadBytes) {
    showToast(`banner 原图不能超过 ${formatFileSize(maxBannerUploadBytes)}`);
    return;
  }

  try {
    const compressed = await compressBannerImage(file);
    adminDraft.eventConfig.bannerImage = {
      mode: "upload",
      name: file.name,
      type: compressed.type,
      size: compressed.size,
      url: compressed.dataUrl,
      sourceUrl: "",
      fitMode: getBannerFitMode(adminDraft.eventConfig.bannerImage),
      storageKey: "",
      uploadedAt: nowIso(),
    };
    render();
    showToast("banner 图片已处理，请保存配置");
  } catch (error) {
    showToast(error?.message || "banner 图片处理失败");
  }
}

function removeBannerImageFromAdminDraft() {
  ensureAdminDraft();
  adminDraft.eventConfig.bannerImage = { ...createEmptyBannerImage(), mode: "upload", fitMode: getBannerFitMode(adminDraft.eventConfig.bannerImage) };
  render();
  showToast("已删除 banner 图片，请保存配置");
}

function clearBannerUrlFromAdminDraft() {
  ensureAdminDraft();
  adminDraft.eventConfig.bannerImage = {
    ...createEmptyBannerImage(),
    mode: "url",
    fitMode: getBannerFitMode(adminDraft.eventConfig.bannerImage),
    _urlPreviewStatus: "idle",
    _urlPreviewMessage: "请输入图片地址",
    _urlPreviewValid: false,
  };
  render();
  showToast("已清空图片地址，请保存配置");
}

function updateBannerDraftFromInput(input, options = {}) {
  ensureAdminDraft();
  const field = input.dataset.adminBannerField;
  const current = normalizeBannerDraft(adminDraft.eventConfig.bannerImage);

  if (field === "mode") {
    const nextMode = input.value === "url" ? "url" : "upload";
    adminDraft.eventConfig.bannerImage =
      nextMode === "url"
        ? {
            ...createEmptyBannerImage(),
            mode: "url",
            fitMode: current.fitMode,
            sourceUrl: current.mode === "url" ? current.sourceUrl : "",
            url: current.mode === "url" ? current.url : "",
            _urlPreviewStatus: current._urlPreviewStatus || "idle",
            _urlPreviewMessage: current._urlPreviewMessage || "请输入图片地址",
            _urlPreviewValid: Boolean(current._urlPreviewValid),
          }
        : current.mode === "upload"
          ? current
          : { ...createEmptyBannerImage(), mode: "upload", fitMode: current.fitMode };
    render();
    return;
  }

  if (field === "fitMode") {
    adminDraft.eventConfig.bannerImage = {
      ...current,
      fitMode: getBannerFitMode({ fitMode: input.value }),
    };
    render();
    return;
  }

  if (field === "sourceUrl") {
    const sourceUrl = input.value.trim();
    adminDraft.eventConfig.bannerImage = {
      ...createEmptyBannerImage(),
      mode: "url",
      fitMode: current.fitMode,
      name: sourceUrl ? "远程 Banner 图片" : "",
      url: sourceUrl,
      sourceUrl,
      _urlPreviewStatus: sourceUrl ? "pending" : "idle",
      _urlPreviewMessage: sourceUrl ? "正在校验图片地址..." : "请输入图片地址",
      _urlPreviewValid: false,
    };
    updateBannerUrlPreviewDom(sourceUrl, adminDraft.eventConfig.bannerImage._urlPreviewStatus, adminDraft.eventConfig.bannerImage._urlPreviewMessage);
    scheduleBannerUrlValidation(sourceUrl);
    if (options.renderAfter) render();
  }
}

function scheduleBannerUrlValidation(sourceUrl) {
  if (bannerUrlValidationTimer && window.clearTimeout) window.clearTimeout(bannerUrlValidationTimer);
  const validationUrl = safeText(sourceUrl).trim();
  const token = (bannerUrlValidationToken += 1);

  if (!validationUrl) return;

  const schedule = window.setTimeout || setTimeout;
  bannerUrlValidationTimer = schedule(() => {
    validateBannerRemoteUrl(validationUrl).then((result) => {
      if (token !== bannerUrlValidationToken) return;
      const banner = normalizeBannerDraft(adminDraft?.eventConfig?.bannerImage);
      if (banner.mode !== "url" || banner.sourceUrl !== validationUrl) return;

      adminDraft.eventConfig.bannerImage = {
        ...banner,
        url: result.valid ? validationUrl : "",
        _urlPreviewStatus: result.valid ? "valid" : "invalid",
        _urlPreviewMessage: result.valid ? "图片地址可用" : "图片地址无效或无法访问",
        _urlPreviewValid: result.valid,
      };
      updateBannerUrlPreviewDom(validationUrl, adminDraft.eventConfig.bannerImage._urlPreviewStatus, adminDraft.eventConfig.bannerImage._urlPreviewMessage);
    });
  }, 350);
}

function updateBannerUrlPreviewDom(url, status, message) {
  const image = document.querySelector("#bannerUrlPreviewImage");
  const statusNode = document.querySelector("#bannerUrlStatus");
  if (image) {
    image.src = url || "";
    image.classList.toggle("is-hidden", !url);
  }
  if (statusNode) {
    statusNode.textContent = message || "";
    statusNode.className = `admin-config-banner-status ${getBannerUrlStatusClass({ _urlPreviewStatus: status })}`;
  }
}

async function validateBannerImageBeforeSave(bannerImage) {
  const banner = normalizeBannerDraft(bannerImage);

  if (banner.mode === "none") return { valid: true, message: "" };
  if (banner.mode === "upload") return { valid: true, message: "" };

  const sourceUrl = safeText(banner.sourceUrl || banner.url).trim();
  if (!sourceUrl) return { valid: true, message: "" };
  if (banner._urlPreviewValid && banner.url === sourceUrl) return { valid: true, message: "" };

  const result = await validateBannerRemoteUrl(sourceUrl);
  if (!result.valid) {
    adminDraft.eventConfig.bannerImage = {
      ...banner,
      url: "",
      _urlPreviewStatus: "invalid",
      _urlPreviewMessage: "图片地址无效或无法访问",
      _urlPreviewValid: false,
    };
    render();
    return { valid: false, message: "图片地址无效或无法访问" };
  }

  adminDraft.eventConfig.bannerImage = {
    ...banner,
    url: sourceUrl,
    sourceUrl,
    name: banner.name || "远程 Banner 图片",
    _urlPreviewStatus: "valid",
    _urlPreviewMessage: "图片地址可用",
    _urlPreviewValid: true,
  };
  return { valid: true, message: "" };
}

function addCertificateTypeConfig() {
  ensureAdminDraft();
  adminDraft.registrationConfig.certificateTypes.push({
    value: "",
    label: "新证件类型",
    _originalLabel: "",
    _originalValue: "",
  });
  render();
}

function removeCertificateTypeConfig(index) {
  ensureAdminDraft();
  const list = adminDraft.registrationConfig.certificateTypes;
  if (list.length <= 1) {
    showToast("至少保留 1 个证件类型");
    return;
  }
  list.splice(index, 1);
  render();
}

function addOrganizationConfig() {
  ensureAdminDraft();
  adminDraft.registrationConfig.organizations = Array.isArray(adminDraft.registrationConfig.organizations)
    ? adminDraft.registrationConfig.organizations
    : [];
  adminDraft.registrationConfig.organizations.push({
    id: "",
    name: "新代表单位",
    enabled: true,
    _originalName: "",
    _originalId: "",
  });
  render();
}

function removeOrganizationConfig(index) {
  ensureAdminDraft();
  const list = adminDraft.registrationConfig.organizations;
  if (!Array.isArray(list)) return;
  list.splice(index, 1);
  render();
}

function toggleOrganizationConfig(index) {
  ensureAdminDraft();
  const organization = adminDraft.registrationConfig.organizations?.[index];
  if (!organization) return;
  organization.enabled = !organization.enabled;
  render();
}

function addGroupConfig() {
  ensureAdminDraft();
  adminDraft.registrationConfig.groups.push({
    id: `group_${timePart()}`,
    name: "新组别",
    genderLimit: "all",
    minBirthYear: 2008,
    maxBirthYear: 2016,
    events: [{ id: `event_${timePart()}`, name: "新项目", fee: 0 }],
  });
  render();
}

function updateGroupConfig(groupIndex, field, value) {
  ensureAdminDraft();
  const group = adminDraft.registrationConfig.groups[groupIndex];
  if (!group) return;
  group[field] = value;
}

function removeGroupConfig(index) {
  ensureAdminDraft();
  const groups = adminDraft.registrationConfig.groups;
  if (groups.length <= 1) {
    showToast("至少保留 1 个组别");
    return;
  }
  groups.splice(index, 1);
  render();
}

function addEventItemToGroup(groupIndex) {
  ensureAdminDraft();
  const group = adminDraft.registrationConfig.groups[groupIndex];
  if (!group) return;
  group.events = Array.isArray(group.events) ? group.events : [];
  group.events.push({ id: `event_${timePart()}`, name: "新项目", fee: 0 });
  render();
}

function updateEventItemInGroup(groupIndex, eventIndex, field, value) {
  ensureAdminDraft();
  const item = adminDraft.registrationConfig.groups[groupIndex]?.events?.[eventIndex];
  if (!item) return;
  item[field] = value;
}

function removeEventItemFromGroup(groupIndex, eventIndex) {
  ensureAdminDraft();
  const group = adminDraft.registrationConfig.groups[groupIndex];
  if (!group) return;
  group.events = Array.isArray(group.events) ? group.events : [];
  if (group.events.length <= 1) {
    showToast("每个组别至少保留 1 个项目");
    return;
  }
  group.events.splice(eventIndex, 1);
  render();
}

function applySuggestedBirthYearRange(groupIndex) {
  ensureAdminDraft();
  const group = adminDraft.registrationConfig.groups[groupIndex];
  if (!group) return;

  const suggestion = getSuggestedBirthYearRange(group.name, adminDraft.eventConfig.competitionStartDate);
  if (!suggestion) {
    showToast("未识别到标准 U 组名称");
    return;
  }

  group.minBirthYear = suggestion.minBirthYear;
  group.maxBirthYear = suggestion.maxBirthYear;
  render();
  showToast("已按建议填充出生年份范围");
}

function resetAdminConfigDraftToDefault() {
  adminDraft = {
    eventConfig: sanitizeEventConfig(event),
    registrationConfig: sanitizeRegistrationConfig(registrationSettings),
  };
  render();
  showToast("已恢复为默认配置，请点击保存生效");
}

async function saveAdminConfigDraft() {
  ensureAdminDraft();
  prepareAdminConfigForSave(adminDraft);
  const validation = validateAdminConfig(adminDraft);
  if (!validation.valid) {
    showToast(validation.message);
    return;
  }
  const bannerValidation = await validateBannerImageBeforeSave(adminDraft.eventConfig.bannerImage);
  if (!bannerValidation.valid) {
    showToast(bannerValidation.message);
    return;
  }

  appState.eventConfig = sanitizeEventConfig(adminDraft.eventConfig);
  appState.registrationConfig = sanitizeRegistrationConfig(adminDraft.registrationConfig);
  saveConfig();
  const normalizeMessage = normalizeDraftAfterConfigChange();
  saveState();
  adminDraft = createAdminDraftFromCurrent();
  render();
  showToast(normalizeMessage || "配置已保存");
}

function validateAdminConfig(draft) {
  const eventConfig = draft?.eventConfig || {};
  const settings = draft?.registrationConfig || {};
  const groups = Array.isArray(settings.groups) ? settings.groups : [];
  const certTypes = Array.isArray(settings.certificateTypes) ? settings.certificateTypes : [];
  const organizations = Array.isArray(settings.organizations) ? settings.organizations : [];

  if (!safeText(eventConfig.name).trim()) return { valid: false, message: "赛事名称不能为空" };
  const pricingRule = sanitizePricingRule(settings.pricingRule, settings);
  if (pricingRule.minEventsPerPerson < 1) return { valid: false, message: "最少报名项目数必须大于等于 1" };
  if (pricingRule.maxEventsPerPerson < 1) return { valid: false, message: "最多报名项目数必须大于等于 1" };
  if (pricingRule.minEventsPerPerson > pricingRule.maxEventsPerPerson) return { valid: false, message: "最少报名项目数不能大于最多报名项目数" };
  if (pricingRule.baseIncludedCount < 1) return { valid: false, message: "基础包含项目数必须大于等于 1" };
  if (pricingRule.basePrice < 0) return { valid: false, message: "基础价格不能小于 0" };
  if (pricingRule.extraPricePerItem < 0) return { valid: false, message: "超出每项加价不能小于 0" };
  if (certTypes.length < 1) return { valid: false, message: "至少保留 1 个证件类型" };
  if (certTypes.some((item) => !safeText(item.label).trim())) {
    return { valid: false, message: "证件名称不能为空" };
  }
  if (hasDuplicates(certTypes.map((item) => safeText(item.value).trim()))) {
    return { valid: false, message: "证件类型 value 不能重复" };
  }
  if (organizations.some((item) => !safeText(item.name).trim())) {
    return { valid: false, message: "代表单位名称不能为空" };
  }
  if (groups.length < 1) return { valid: false, message: "至少保留 1 个组别" };
  for (const group of groups) {
    if (!safeText(group.name).trim()) return { valid: false, message: "组别名称不能为空" };
    if (Number(group.minBirthYear) > Number(group.maxBirthYear)) return { valid: false, message: "组别出生年份范围不正确" };
    if (!Array.isArray(group.events) || group.events.length < 1) return { valid: false, message: "每个组别至少保留 1 个项目" };
    for (const item of group.events) {
      if (!safeText(item.name).trim()) return { valid: false, message: "项目名称不能为空" };
      if (Number(item.fee) < 0) return { valid: false, message: "项目费用不能小于 0" };
    }
  }

  return { valid: true, message: "" };
}

function prepareAdminConfigForSave(draft) {
  const certificateTypes = Array.isArray(draft?.registrationConfig?.certificateTypes) ? draft.registrationConfig.certificateTypes : [];
  const usedCertificateValues = new Set();
  certificateTypes.forEach((item) => {
    const hasOriginalMeta = Object.prototype.hasOwnProperty.call(item, "_originalLabel");
    const labelChanged = hasOriginalMeta && safeText(item.label).trim() !== safeText(item._originalLabel).trim();
    const preferredValue = hasOriginalMeta
      ? labelChanged
        ? createCertificateValueFromLabel(item.label)
        : item._originalValue || item.value || createCertificateValueFromLabel(item.label)
      : item.value || createCertificateValueFromLabel(item.label);
    item.value = createUniqueId(preferredValue, usedCertificateValues);
  });

  const organizations = Array.isArray(draft?.registrationConfig?.organizations) ? draft.registrationConfig.organizations : [];
  const usedOrganizationIds = new Set();
  organizations.forEach((item) => {
    const hasOriginalMeta = Object.prototype.hasOwnProperty.call(item, "_originalName");
    const nameChanged = hasOriginalMeta && safeText(item.name).trim() !== safeText(item._originalName).trim();
    const preferredId = hasOriginalMeta
      ? nameChanged
        ? createOrganizationIdFromName(item.name)
        : item._originalId || item.id || createOrganizationIdFromName(item.name)
      : item.id || createOrganizationIdFromName(item.name);
    item.id = createUniqueId(preferredId, usedOrganizationIds);
    item.enabled = item.enabled !== false;
  });

  const groups = Array.isArray(draft?.registrationConfig?.groups) ? draft.registrationConfig.groups : [];
  const usedGroupIds = new Set();

  groups.forEach((group) => {
    group.id = createUniqueId(createGroupIdFromConfig(group), usedGroupIds);
    const usedEventIds = new Set();
    group.events = Array.isArray(group.events) ? group.events : [];
    group.events.forEach((item) => {
      item.id = createUniqueId(createEventIdFromName(item.name), usedEventIds);
    });
  });
}
