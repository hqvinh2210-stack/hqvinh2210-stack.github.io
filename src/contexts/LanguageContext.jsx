import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

export const supportedLanguages = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

const languageCodes = supportedLanguages.map((item) => item.code);

function normalizeLanguage(nextLanguage) {
  return languageCodes.includes(nextLanguage) ? nextLanguage : "en";
}

export const translations = {
  en: {
    profile: {
      title: "Data Analyst",
      location: "Vietnam · Remote-friendly",
      valueProp:
        "I turn messy operational data into clear decisions: problem, analysis, insight, and quantified impact.",
      bio: "Data analyst focused on e-commerce and operational analytics. I build end-to-end pipelines (CSV to star schema), exploratory models (RFM / clustering), and dashboards that product and ops teams can actually use. Comfortable moving between SQL, Python, and BI tools without losing the business question.",
    },
    nav: {
      about: "About",
      projects: "Projects",
      dashboards: "Dashboards",
      experience: "Experience",
      contact: "Contact",
      hire: "Hire me",
      menuLabel: "Toggle menu",
    },
    hero: {
      badge: "Open to analyst roles",
      ctaProjects: "View projects",
      ctaCaseStudy: "Read case study",
      metrics: {
        orders: "orders modeled",
        gmv: "GMV unified",
        onTime: "on-time baseline",
      },
    },
    about: {
      kicker: "About",
      heading: "Analytical by default. Story-driven by design.",
      intro: "Every engagement follows the same arc:",
      usageDepth: "= usage depth, not a self-scored %",
      mapTitle: "Skill usage map",
      mapDescription:
        "Axis shows how often I use each skill in real work, not a 0-100 proficiency score.",
      labels: {
        daily: "Daily",
        project: "Project",
        learning: "Learning",
      },
    },
    projects: {
      kicker: "Featured projects",
      heading: "Problem → analysis → insight → impact",
      description:
        "Each card highlights the business question and the numbers that changed how stakeholders saw the system.",
      problemLabel: "Problem:",
      link: "Open case study",
      items: {
        "olist-dw": {
          title: "Olist E-Commerce Data Warehouse",
          problem:
            "Fragmented CSVs made it hard to trust GMV, delivery SLA, and category performance across 2 years of orders.",
          metrics: ["Delivered orders", "On-time rate"],
        },
        "rfm-segments": {
          title: "RFM Customer Segmentation",
          problem:
            "Marketing needed a durable customer grouping beyond one-off spreadsheets: who is loyal, who is at risk, who is high-value.",
          metrics: ["Customers scored", "Silhouette (k=3)"],
        },
        "ops-sla": {
          title: "Delivery SLA Insight Layer",
          problem:
            "Late deliveries were discussed anecdotally. Ops needed a single definition of on-time and a path to root causes by region.",
          metrics: ["On-time deliveries", "Avg review score"],
        },
      },
    },
    dashboard: {
      kicker: "Dashboard showcase",
      heading: "Live aggregates from the Olist gold layer",
      description:
        "Same KPI definitions as the warehouse export. Each chart includes a one-line business read, not only a picture.",
      link: "Open full case study",
      error: "Could not load dashboard JSON. Run the warehouse export, then refresh.",
      cards: {
        delivered: "Delivered orders",
        gmv: "Total GMV",
        aov: "AOV",
        onTime: "On-time rate",
      },
      insights: {
        gmv: "Monthly GMV shows the growth ramp through 2017-2018 that finance should plan capacity around.",
        orders: "Order volume tracks GMV closely; spikes flag campaign or marketplace events worth root-causing.",
        payments: "Payment mix shapes cash timing (card vs boleto) and installment risk.",
      },
      charts: {
        gmv: "Monthly GMV",
        orders: "Orders by month",
        payments: "Payment mix (top types)",
        hover: "hover for detail",
      },
      directions: {
        up: "up",
        down: "down",
      },
      insightLabel: "Insight:",
      kpiRead: "KPI read:",
      findingsLink: "See findings, EDA, and RFM clustering",
    },
    experience: {
      kicker: "Experience",
      heading: "Timeline of impact",
    },
    contact: {
      kicker: "Contact",
      heading: "Let's talk about your next data question",
      description:
        "Open to full-time analyst roles and analytics projects. Share the problem space — I will come back with a measurement plan.",
      name: "Name",
      email: "Email",
      message: "Message",
      placeholderName: "Your name",
      placeholderEmail: "you@company.com",
      placeholderMessage: "What decision are you trying to improve with data?",
      button: "Send message",
      sent: "Opening your email client…",
    },
    footer: {
      line: "Problem → Analysis → Insight → Impact",
    },
    caseStudy: {
      back: "← Projects",
      notFound: "Case study not found",
      backHome: "Back home",
      sections: {
        context: "Context",
        source: "Data source",
        eda: "EDA",
        warehouse: "Warehouse",
        method: "Methodology",
        clustering: "Clustering 3D",
        findings: "Key findings",
        recommend: "Recommendations",
        impact: "Impact",
      },
      labels: {
        industry: "Industry",
        period: "Period",
        goal: "Goal",
        questions: "Questions that drove the EDA",
        sourceProfile: "Source profile (9 tables)",
        file: "File",
        rows: "Rows",
        grain: "Grain",
        role: "Role in DW",
      },
    },
  },
  vi: {
    profile: {
      title: "Chuyên viên Phân tích Dữ liệu",
      location: "Việt Nam · Sẵn sàng làm remote",
      valueProp:
        "Tôi biến dữ liệu vận hành rời rạc thành quyết định rõ ràng: vấn đề, phân tích, insight và tác động đo lường được.",
      bio: "Data analyst tập trung vào phân tích thương mại điện tử và vận hành. Tôi xây dựng pipeline end-to-end (CSV đến star schema), mô hình khám phá (RFM / clustering), và dashboard mà đội sản phẩm, vận hành có thể sử dụng thực tế. Tôi có thể chuyển đổi linh hoạt giữa SQL, Python và BI tool mà vẫn giữ trọng tâm là câu hỏi kinh doanh.",
    },
    nav: {
      about: "Giới thiệu",
      projects: "Dự án",
      dashboards: "Dashboard",
      experience: "Kinh nghiệm",
      contact: "Liên hệ",
      hire: "Thuê tôi",
      menuLabel: "Mở menu",
    },
    hero: {
      badge: "Sẵn sàng cho các vai trò phân tích dữ liệu",
      ctaProjects: "Xem dự án",
      ctaCaseStudy: "Xem case study",
      metrics: {
        orders: "đơn hàng được mô hình hóa",
        gmv: "GMV được thống nhất",
        onTime: "tỷ lệ đúng hạn",
      },
    },
    about: {
      kicker: "Giới thiệu",
      heading: "Luôn tư duy phân tích. Kể chuyện bằng dữ liệu.",
      intro: "Mỗi dự án đều theo cùng một vòng lặp:",
      usageDepth: "= mức độ sử dụng, không phải điểm tự chấm %",
      mapTitle: "Bản đồ kỹ năng",
      mapDescription:
        "Trục biểu diễn mức độ sử dụng kỹ năng trong công việc thực tế, không phải điểm năng lực từ 0-100.",
      labels: {
        daily: "Hằng ngày",
        project: "Dự án",
        learning: "Đang học",
      },
    },
    projects: {
      kicker: "Dự án tiêu biểu",
      heading: "Vấn đề → phân tích → insight → tác động",
      description:
        "Mỗi thẻ làm nổi bật câu hỏi kinh doanh và các con số giúp bên liên quan nhìn rõ hệ thống hơn.",
      problemLabel: "Vấn đề:",
      link: "Mở case study",
      items: {
        "olist-dw": {
          title: "Kho dữ liệu thương mại điện tử Olist",
          problem:
            "Các file CSV rời rạc khiến việc tin cậy GMV, SLA giao hàng và hiệu suất danh mục trong 2 năm đơn hàng trở nên khó khăn.",
          metrics: ["Đơn hàng đã giao", "Tỷ lệ đúng hạn"],
        },
        "rfm-segments": {
          title: "Phân khúc khách hàng RFM",
          problem:
            "Marketing cần một cách nhóm khách hàng bền vững hơn các bảng tính rời rạc: ai trung thành, ai có nguy cơ rời bỏ, ai có giá trị cao.",
          metrics: ["Khách hàng được chấm điểm", "Silhouette (k=3)"],
        },
        "ops-sla": {
          title: "Lớp insight SLA giao hàng",
          problem:
            "Giao hàng trễ trước đây thường được bàn theo cảm tính. Đội vận hành cần một định nghĩa thống nhất về đúng hạn và cách truy nguyên nguyên nhân theo khu vực.",
          metrics: ["Giao hàng đúng hạn", "Điểm đánh giá TB"],
        },
      },
    },
    dashboard: {
      kicker: "Trình diễn dashboard",
      heading: "Tổng hợp trực tiếp từ lớp gold của Olist",
      description:
        "Cùng định nghĩa KPI như trong export kho dữ liệu. Mỗi biểu đồ đều đi kèm một câu đọc hiểu kinh doanh ngắn gọn.",
      link: "Xem case study đầy đủ",
      error: "Không tải được file JSON dashboard. Hãy chạy export kho dữ liệu rồi refresh lại trang.",
      cards: {
        delivered: "Đơn hàng đã giao",
        gmv: "Tổng GMV",
        aov: "AOV",
        onTime: "Tỷ lệ đúng hạn",
      },
      insights: {
        gmv: "GMV hàng tháng cho thấy đà tăng trưởng trong giai đoạn 2017-2018 mà finance nên dùng để lên kế hoạch năng lực.",
        orders: "Khối lượng đơn hàng đi cùng GMV; các đỉnh tăng là nơi nên kiểm tra sự kiện marketing hoặc vận hành.",
        payments: "Tỷ trọng phương thức thanh toán ảnh hưởng đến dòng tiền và rủi ro trả góp.",
      },
      charts: {
        gmv: "GMV theo tháng",
        orders: "Đơn hàng theo tháng",
        payments: "Cơ cấu thanh toán (các loại top)",
        hover: "di chuột để xem chi tiết",
      },
      directions: {
        up: "tăng",
        down: "giảm",
      },
      insightLabel: "Insight:",
      kpiRead: "Đọc KPI:",
      findingsLink: "Xem findings, EDA và phân cụm RFM",
    },
    experience: {
      kicker: "Kinh nghiệm",
      heading: "Dòng thời gian tạo ra tác động",
    },
    contact: {
      kicker: "Liên hệ",
      heading: "Hãy nói về câu hỏi dữ liệu tiếp theo của bạn",
      description:
        "Sẵn sàng nhận vai trò analyst full-time hoặc các dự án analytics. Chia sẻ bối cảnh vấn đề — tôi sẽ quay lại với một kế hoạch đo lường.",
      name: "Tên",
      email: "Email",
      message: "Tin nhắn",
      placeholderName: "Tên của bạn",
      placeholderEmail: "ban@congty.com",
      placeholderMessage: "Bạn đang muốn cải thiện quyết định nào bằng dữ liệu?",
      button: "Gửi tin nhắn",
      sent: "Đang mở email client…",
    },
    footer: {
      line: "Vấn đề → Phân tích → Insight → Tác động",
    },
    caseStudy: {
      back: "← Dự án",
      notFound: "Không tìm thấy case study",
      backHome: "Quay về trang chủ",
      sections: {
        context: "Bối cảnh",
        source: "Nguồn dữ liệu",
        eda: "EDA",
        warehouse: "Kho dữ liệu",
        method: "Phương pháp",
        clustering: "Phân cụm 3D",
        findings: "Những phát hiện chính",
        recommend: "Khuyến nghị",
        impact: "Tác động",
      },
      labels: {
        industry: "Ngành",
        period: "Thời gian",
        goal: "Mục tiêu",
        questions: "Những câu hỏi dẫn dắt EDA",
        sourceProfile: "Thông tin nguồn dữ liệu (9 bảng)",
        file: "Tệp",
        rows: "Số dòng",
        grain: "Grain",
        role: "Vai trò trong DW",
      },
    },
  },
};

export const CASE_STUDY_COPY = {
  en: {
    notFound: "Case study not found",
    backHome: "Back home",
    backProjects: "← Projects",
    sections: {
      context: "Context",
      source: "Data source",
      eda: "EDA",
      warehouse: "Warehouse",
      method: "Methodology",
      clustering: "Clustering 3D",
      findings: "Key findings",
      recommend: "Recommendations",
      impact: "Impact",
    },
    labels: {
      industry: "Industry",
      period: "Period",
      goal: "Goal",
      questions: "Questions that drove the EDA",
      sourceProfile: "Source profile (9 tables)",
      file: "File",
      rows: "Rows",
      grain: "Grain",
      role: "Role in DW",
      cleaning: "Cleaning and transform rules",
      deliveredOrders: "Delivered orders",
      totalGmv: "Total GMV",
      onTimeRate: "On-time rate",
      repeatCustomers: "Repeat customers",
      topCategories: "Top categories by GMV",
      topStates: "Top states by GMV",
      loadingCategory: "Loading category mix…",
      loadingRegional: "Loading regional mix…",
      designPrinciples: "Design principles",
      factGrains: "Fact grains",
      rowsSuffix: "rows",
      qualityChecks: "Quality checks in the pipeline",
      goldRows: "Gold layer row counts (live export)",
      methodology: "Methodology",
      method: "Method",
      features: "Features",
      customersScored: "Customers scored",
      selected: "Selected",
      via: "via",
      businessRead: "Business read:",
      clusterScatter: "Cluster scatter (RFM sample)",
      pointsFrom: "points from gold RFM extract",
      loadingCluster: "Loading cluster sample…",
      reducedMotion:
        "Prefer 2D if motion is reduced or the device is slow. 3D adds frequency as depth; 2D keeps Recency × Monetary for a flat CRM view.",
      evalMetrics: "Evaluation metrics (final model)",
      higherBetter: "Higher is better",
      lowerBetter: "Lower is better",
      kSelection: "k selection: silhouette vs k",
      sampleEval: "sample eval",
      elbow: "Elbow: inertia vs k",
      loadingK: "Loading k comparison…",
      loadingElbow: "Loading elbow curve…",
      selectedBadge: "selected",
      segmentProfiles: "Segment profiles",
      customersShort: "cust",
      gmvShare: "GMV share",
      recencyMean: "Recency (mean)",
      frequencyMean: "Frequency (mean)",
      monetaryMean: "Monetary (mean)",
      silhouetteCluster: "Silhouette (cluster)",
      segmentSize: "Segment size vs GMV share",
      pctCustomers: "% customers",
      pctGmv: "% GMV",
      keyFindings: "Key findings",
      gmvOrders: "GMV & orders over time",
      fromGold: "from gold export",
      orders: "Orders",
      recommendations: "Business recommendations",
      impact: "Impact / results",
      repoNote: "Pipeline source lives in this repo under",
      edaSourceNote: "EDA source tables under",
      dashboardCta: "View dashboard showcase",
      clusterCta: "Jump to 3D clusters",
    },
    businessRead: (champs) => (
      <>
        Champions are about{" "}
        <span className="font-mono font-semibold text-primary">{champs.pct}%</span>{" "}
        of customers but drive about{" "}
        <span className="font-mono font-semibold text-primary">
          {champs.gmv_share_pct}%
        </span>{" "}
        of GMV. A small high-value cohort carries most revenue; CRM should protect
        them first, then win back At Risk.
      </>
    ),
    segmentNames: {
      Champions: "Champions",
      "Potential Loyalists": "Potential Loyalists",
      "At Risk / Hibernating": "At Risk / Hibernating",
    },
  },
  vi: {
    notFound: "Không tìm thấy case study",
    backHome: "Về trang chủ",
    backProjects: "← Dự án",
    sections: {
      context: "Bối cảnh",
      source: "Nguồn dữ liệu",
      eda: "EDA",
      warehouse: "Kho dữ liệu",
      method: "Phương pháp",
      clustering: "Phân cụm 3D",
      findings: "Insight chính",
      recommend: "Khuyến nghị",
      impact: "Tác động",
    },
    labels: {
      industry: "Ngành",
      period: "Giai đoạn",
      goal: "Mục tiêu",
      questions: "Các câu hỏi dẫn dắt EDA",
      sourceProfile: "Hồ sơ nguồn dữ liệu (9 bảng)",
      file: "File",
      rows: "Dòng",
      grain: "Grain",
      role: "Vai trò trong DW",
      cleaning: "Quy tắc làm sạch và biến đổi",
      deliveredOrders: "Đơn hàng đã giao",
      totalGmv: "Tổng GMV",
      onTimeRate: "Tỷ lệ đúng hạn",
      repeatCustomers: "Khách hàng mua lại",
      topCategories: "Danh mục dẫn đầu theo GMV",
      topStates: "Bang dẫn đầu theo GMV",
      loadingCategory: "Đang tải cơ cấu danh mục…",
      loadingRegional: "Đang tải cơ cấu khu vực…",
      designPrinciples: "Nguyên tắc thiết kế",
      factGrains: "Grain của fact",
      rowsSuffix: "dòng",
      qualityChecks: "Kiểm tra chất lượng trong pipeline",
      goldRows: "Số dòng lớp gold (export trực tiếp)",
      methodology: "Phương pháp",
      method: "Phương pháp",
      features: "Biến đầu vào",
      customersScored: "Khách hàng được chấm điểm",
      selected: "Chọn",
      via: "theo",
      businessRead: "Đọc hiểu kinh doanh:",
      clusterScatter: "Scatter phân cụm (mẫu RFM)",
      pointsFrom: "điểm từ gold RFM extract",
      loadingCluster: "Đang tải mẫu phân cụm…",
      reducedMotion:
        "Ưu tiên 2D nếu giảm chuyển động hoặc thiết bị chậm. 3D thêm Frequency làm chiều sâu; 2D giữ Recency × Monetary để xem CRM phẳng.",
      evalMetrics: "Chỉ số đánh giá (mô hình cuối)",
      higherBetter: "Càng cao càng tốt",
      lowerBetter: "Càng thấp càng tốt",
      kSelection: "Chọn k: silhouette so với k",
      sampleEval: "đánh giá mẫu",
      elbow: "Elbow: inertia so với k",
      loadingK: "Đang tải so sánh k…",
      loadingElbow: "Đang tải đường elbow…",
      selectedBadge: "được chọn",
      segmentProfiles: "Hồ sơ phân khúc",
      customersShort: "KH",
      gmvShare: "Tỷ trọng GMV",
      recencyMean: "Recency (trung bình)",
      frequencyMean: "Frequency (trung bình)",
      monetaryMean: "Monetary (trung bình)",
      silhouetteCluster: "Silhouette (cụm)",
      segmentSize: "Quy mô phân khúc so với tỷ trọng GMV",
      pctCustomers: "% khách hàng",
      pctGmv: "% GMV",
      keyFindings: "Insight chính",
      gmvOrders: "GMV & đơn hàng theo thời gian",
      fromGold: "từ gold export",
      orders: "Đơn hàng",
      recommendations: "Khuyến nghị kinh doanh",
      impact: "Tác động / kết quả",
      repoNote: "Mã nguồn pipeline nằm trong repo tại",
      edaSourceNote: "bảng nguồn EDA tại",
      dashboardCta: "Xem dashboard",
      clusterCta: "Nhảy tới phân cụm 3D",
    },
    businessRead: (champs) => (
      <>
        Nhóm Champions chiếm khoảng{" "}
        <span className="font-mono font-semibold text-primary">{champs.pct}%</span>{" "}
        khách hàng nhưng tạo ra khoảng{" "}
        <span className="font-mono font-semibold text-primary">
          {champs.gmv_share_pct}%
        </span>{" "}
        GMV. Một nhóm nhỏ giá trị cao đang gánh phần lớn doanh thu; CRM nên bảo vệ
        nhóm này trước, sau đó win-back nhóm At Risk.
      </>
    ),
    segmentNames: {
      Champions: "Khách hàng champion",
      "Potential Loyalists": "Khách hàng tiềm năng trung thành",
      "At Risk / Hibernating": "Có nguy cơ / ngủ đông",
    },
  },
};

export const VI_CASE_STUDY = {
  title: "Kho dữ liệu thương mại điện tử Olist Brazil",
  subtitle:
    "EDA, kho dữ liệu medallion và phân cụm RFM: từ 9 file CSV thô đến KPI đáng tin cậy và quyết định theo phân khúc.",
  context: {
    industry: "Sàn thương mại điện tử (Brazil)",
    period: "2016-09 đến 2018-10",
    goal: "Tạo một nguồn sự thật duy nhất cho doanh thu, hiệu suất giao hàng và hành vi khách hàng để stakeholder có thể khám phá mà không phải xử lý CSV thô thủ công.",
  },
  dataSource: [
    "Bộ dữ liệu công khai Olist: orders, items, payments, reviews, products, sellers, customers, geolocation",
    "9 bảng nguồn trong EDA/ được nạp vào kho dữ liệu DuckDB",
    "Tiền tệ: BRL. Phạm vi KPI chính: đơn hàng đã giao",
  ],
  eda: {
    title: "Phân tích khám phá dữ liệu",
    summary:
      "Trước khi mô hình hóa, tôi profile từng bảng nguồn: grain, khóa, null và đường join. Mục tiêu là cố định định nghĩa kinh doanh (GMV, đúng hạn, khách hàng duy nhất) để warehouse và ML dùng chung một sự thật.",
    questions: [
      "Grain tự nhiên của từng file là gì, và khóa nào thực sự join được?",
      "Trạng thái đơn hàng, timestamp giao hàng và review ảnh hưởng thế nào đến filter KPI?",
      "customer_id có phải theo từng đơn, còn customer_unique_id mới là người mua thật không?",
      "Null, nhiều payment trong một đơn và nhiều tọa độ theo zip làm hỏng join ngây thơ ở đâu?",
    ],
    sourceTables: [
      { file: "olist_orders_dataset.csv", rows: "99,441", grain: "1 dòng / đơn hàng", role: "Header đơn hàng + timeline giao hàng" },
      { file: "olist_order_items_dataset.csv", rows: "112,650", grain: "1 dòng / item trong đơn", role: "Nguồn fact bán hàng chính" },
      { file: "olist_order_payments_dataset.csv", rows: "103,886", grain: "1 dòng / lượt thanh toán", role: "Cơ cấu thanh toán và trả góp" },
      { file: "olist_order_reviews_dataset.csv", rows: "99,224", grain: "1 dòng / review", role: "Mức hài lòng và câu chuyện SLA" },
      { file: "olist_customers_dataset.csv", rows: "99,441", grain: "1 dòng / customer_id (session)", role: "Map sang customer_unique_id" },
      { file: "olist_products_dataset.csv", rows: "32,951", grain: "1 dòng / sản phẩm", role: "Danh mục và thuộc tính vật lý" },
      { file: "olist_sellers_dataset.csv", rows: "3,095", grain: "1 dòng / seller", role: "Địa lý và hiệu suất seller" },
      { file: "olist_geolocation_dataset.csv", rows: "1,000,163", grain: "nhiều lat/lng cho mỗi zip", role: "Tổng hợp thành dim_geography" },
      { file: "product_category_name_translation.csv", rows: "71", grain: "1 dòng / danh mục", role: "Dịch nhãn danh mục PT sang EN" },
    ],
    keyFindings: [
      {
        title: "customer_id không phải người mua thật",
        body: "customer_id theo từng session/đơn hàng. Hành vi mua lại thật phải dùng customer_unique_id (~96K người). Dùng sai khóa sẽ thổi phồng unique customers và làm sai retention.",
      },
      {
        title: "Một đơn có thể nhiều payment và nhiều item",
        body: "Một order có thể có nhiều dòng payment và nhiều item. Payment value và GMV không được double-count khi roll lên grain đơn hàng.",
      },
      {
        title: "Geolocation cần được tổng hợp",
        body: "Zip code có nhiều mẫu lat/lng. Staging lấy trung bình tọa độ theo zip trước khi join vào dimension khách hàng và seller.",
      },
      {
        title: "Filter KPI: chỉ lấy đơn đã giao",
        body: "GMV và AOV chính dùng đơn delivered. Cancelled và unavailable vẫn nằm trong warehouse cho funnel view nhưng không vào KPI doanh thu.",
      },
    ],
    cleaningRules: [
      "Ép kiểu timestamp và numeric khi load bronze",
      "Dòng Unknown dimension (sk = -1) cho product / seller / geo bị thiếu",
      "Dedupe theo grain fact: (order_id, order_item_id), order_id, payment sequence",
      "Join tên danh mục sang nhãn tiếng Anh để BI dễ đọc",
      "Tính delivery days và cờ is_late từ ngày mua, ngày dự kiến và ngày giao thực tế",
    ],
  },
  warehouse: {
    title: "Xử lý kho dữ liệu",
    architecture: "Medallion (Bronze → Silver → Gold) trên DuckDB với star schema Kimball",
    layers: [
      { name: "Bronze (staging)", detail: "Bảng stg_*: cột CSV thô kèm _loaded_at và _source_file. Biến đổi tối thiểu để reload vẫn audit được." },
      { name: "Silver (conformed)", detail: "Bảng đã ép kiểu và làm sạch. Xử lý null, chuẩn bị FK, tổng hợp geo, dịch danh mục. Validate business key trước khi tạo dimension." },
      { name: "Gold (star + mart)", detail: "dim_date, dim_customer, dim_product, dim_seller, dim_geography + fact_order, fact_order_item, fact_payment, fact_review. Mart export GMV tháng, danh mục, payment, khu vực." },
      { name: "Serving", detail: "pipeline.export_web ghi dashboard.json cho portfolio. ML đọc gold.fact_order + dimension để tạo đặc trưng RFM." },
    ],
    designPrinciples: [
      "Ưu tiên star schema cho BI; mọi dimension có surrogate key (*_sk)",
      "Dimension conformed dùng chung giữa các fact (date, customer, product, seller, geo)",
      "Measure cộng được lưu dạng raw; tỷ lệ (AOV, on-time %) tính ở mart / semantic layer",
      "Khóa đến muộn hoặc thiếu map vào Unknown (sk = -1), không âm thầm drop dòng",
    ],
    qualityChecks: [
      { name: "Có dữ liệu", rule: "Ngưỡng số dòng tối thiểu trên mọi bảng gold" },
      { name: "PK duy nhất", rule: "Không trùng grain trên fact_order / fact_order_item" },
      { name: "Rò rỉ Unknown", rule: "Cảnh báo khi tỷ lệ product_sk / seller_sk = -1 cao" },
      { name: "KPI hợp lý", rule: "GMV, tỷ lệ đúng hạn, điểm review nằm trong khoảng kỳ vọng" },
    ],
    grains: [
      { fact: "fact_order_item", grain: "1 dòng = 1 dòng sản phẩm trong 1 đơn hàng", rows: "~112,650" },
      { fact: "fact_order", grain: "1 dòng = 1 header đơn hàng", rows: "~99,441" },
      { fact: "fact_payment", grain: "1 dòng = 1 lượt thanh toán", rows: "~103,886" },
      { fact: "fact_review", grain: "1 dòng = 1 review", rows: "~99,224" },
    ],
  },
  methodology: [
    "EDA: profile 9 CSV, ghi nhận grain, khóa, null và filter KPI",
    "Bronze: ingest có ép kiểu từ EDA/ kèm metadata load",
    "Silver: làm sạch, dedupe, tổng hợp geolocation, dịch danh mục",
    "Gold Kimball dimension + fact với surrogate key và dòng Unknown",
    "Bộ kiểm tra chất lượng: số dòng, uniqueness, unknown leakage, KPI bounds",
    "Gold mart + JSON export cho BI tĩnh trên portfolio",
    "Đặc trưng RFM + RobustScaler + KMeans (chọn k bằng silhouette)",
  ],
  clustering: {
    title: "Kết quả phân cụm RFM",
    method: "RFM + RobustScaler + KMeans",
    features: ["recency_days", "log1p(frequency)", "log1p(monetary)"],
    nCustomers: "93,358",
    k: 3,
    selectionRule: "argmax silhouette trên k trong [3..6]",
    metricNotes: {
      silhouette: "[-1, 1] càng cao càng tốt: độ tách biệt so với độ kết dính",
      davies_bouldin: ">= 0 càng thấp càng tốt: độ tương đồng trung bình giữa các cụm",
      calinski_harabasz: "càng cao càng tốt: phân tán giữa cụm / trong cụm",
      inertia: "SSE tới centroid; càng thấp càng tốt; dùng elbow để so sánh theo k",
    },
  },
  findings: [
    { title: "Quy mô doanh thu rõ ràng và có mùa vụ", body: "Delivered GMV đạt ~R$13.2M trên 96.5K đơn hàng. Chuỗi tháng cho thấy tăng trưởng rõ trong 2017-2018 kèm biến động mà ops và finance nên đưa vào kế hoạch." },
    { title: "Độ tin cậy giao hàng là điểm mạnh", body: "Tỷ lệ đúng hạn đạt 93.2%. Đây là baseline cho dashboard SLA và theo dõi ngoại lệ theo khu vực hoặc proxy carrier." },
    { title: "Mua lại còn mỏng; retention là cơ hội mở", body: "Tỷ lệ khách mua lại chỉ khoảng ~3%. Phân khúc RFM làm rõ nhóm giá trị cao và nhóm rủi ro để CRM tập trung giữ chân, không chỉ acquisition." },
    { title: "Chất lượng review đi cùng câu chuyện vận hành", body: "Điểm review trung bình ~4.09. Kết hợp review với giao hàng trễ tạo một đòn bẩy đo được: bảo vệ SLA để bảo vệ uy tín." },
  ],
  recommendations: [
    "Xuất bản gói SLA hằng tuần: % đúng hạn, số lượng trễ và khu vực trễ nhiều nhất với cùng định nghĩa như warehouse.",
    "Triển khai pilot retention cho nhóm RFM Champions và At-Risk (thử nghiệm offer + timing).",
    "Xem danh mục và payment mix như view có xét margin khi có dữ liệu chi phí. GMV đơn thuần chưa đủ.",
    "Giữ dimension key ổn định để Power BI / Tableau không phải bind lại khi có tháng mới.",
  ],
  impact: [
    { label: "Đơn hàng hợp nhất", value: "96,478", note: "Grain delivered trong fact_order" },
    { label: "GMV mô hình hóa", value: "R$13.2M", note: "Baseline doanh thu đáng tin cậy" },
    { label: "Baseline đúng hạn", value: "93.2%", note: "Định nghĩa SLA đã khóa" },
    { label: "Khách hàng phân khúc", value: "93,358", note: "RFM + KMeans" },
  ],
};


export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    return normalizeLanguage(window.localStorage.getItem("portfolio-language"));
  });

  const setLanguage = (nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage));
  };

  const toggleLanguage = () => {
    setLanguageState((currentLanguage) => (currentLanguage === "en" ? "vi" : "en"));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("portfolio-language", language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      supportedLanguages,
      t: (key) => {
        const parts = key.split(".");
        let current = translations[language] || translations.en;
        for (const part of parts) {
          current = current?.[part];
          if (current == null) return key;
        }
        return current;
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
