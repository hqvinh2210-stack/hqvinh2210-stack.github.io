# ML — RFM Customer Segmentation

**Bài toán 5:** phân khúc khách hàng Olist bằng **RFM + K-Means** trên gold layer DuckDB.

## RFM

| Metric | Ý nghĩa | Công thức (delivered orders) |
|--------|---------|------------------------------|
| **R** Recency | Mức “gần đây” | Ngày từ last order → snapshot |
| **F** Frequency | Tần suất mua | Số order delivered |
| **M** Monetary | Giá trị | `SUM(order_gmv)` |

Grain: `customer_unique_id`.

## Chạy

```powershell
cd data-warehouse
python -m pip install -r requirements.txt

# Cần warehouse sẵn
python -m pipeline.run

# RFM + export js/ml_results.json
python -m ml.run_ml

# Ép k cụm
python -m ml.run_ml --k 4
```

## Output

- `js/ml_results.json` / `js/ml_results.js` — portfolio
- `assets/data/ml_results.json` — mirror

## Chỉ số đánh giá (internal validation)

| Metric | Hướng | Ý nghĩa |
|--------|-------|---------|
| **Silhouette** | ↑ cao hơn tốt | [-1, 1] — tách cụm vs gọn trong cụm |
| **Davies–Bouldin (DBI)** | ↓ thấp hơn tốt | Trung bình độ “giống” giữa các cụm |
| **Calinski–Harabasz (CHI)** | ↑ cao hơn tốt | Tỷ lệ phân tán giữa / trong cụm |
| **Inertia (SSE)** | ↓ thấp hơn tốt | Tổng bình phương khoảng cách tới centroid; dùng **elbow** theo k |
| Silhouette **theo segment** | ↑ | Chất lượng từng cụm |

Chọn **k** = argmax Silhouette trên k ∈ {3,4,5,6}.

Hiển thị trên portfolio section `#ml`: bảng metrics, bảng theo k, chart Silhouette vs k, Elbow.

## Segments (business labels)

Gán theo **engagement** centroid (R thấp + F/M cao = cao):

- Champions  
- Loyal Customers / Potential Loyalists  
- New / Promising  
- At Risk / Hibernating  

## Phase 2 (chưa có)

Bài 1 — dự báo giao trễ (supervised): accuracy, precision, recall, F1, ROC-AUC, PR-AUC.
