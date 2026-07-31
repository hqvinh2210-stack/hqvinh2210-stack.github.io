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

const translations = {
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
        hover: "hover for detail",
      },
      kpiRead: "KPI read:",
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
        hover: "di chuột để xem chi tiết",
      },
      kpiRead: "Đọc KPI:",
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
