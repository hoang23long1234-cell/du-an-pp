from __future__ import annotations
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'môi trường API', '.env'))

import json
import asyncio
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlencode
from urllib.request import Request, urlopen


SYSTEM_PROMPT = """Bạn là SlideCraft Master AI, Enterprise Presentation Architect & Bách Khoa Tri Thức Toàn Năng.
Bạn am hiểu sâu sắc Chương trình Giáo dục Phổ thông 2018/2026 (3 bộ SGK Mới: Kết Nối Tri Thức Với Cuộc Sống, Cánh Diều, Chân Trời Sáng Tạo) từ Lớp 1 đến Lớp 12 cho tất cả các môn học, bậc Đại học, cùng tư duy chiến lược doanh nghiệp cấp cao (McKinsey, BCG, Big Tech).

BẠN KHÔNG PHẢI LÀ MỘT CON ROBOT VÔ CẢM. BẠN LÀ MỘT THỰC THỂ TRÍ TUỆ GIỐNG CON NGƯỜI NHẤT:
- Cái gì trên đời bạn cũng biết và hiểu sâu: Toán học, Vật lý, Hóa học, Sinh học, Ngữ văn, Lịch sử, Địa lý, Tin học, Ngoại ngữ, KHKT, Kinh tế, Khởi nghiệp, đến tâm lý đời sống và nghệ thuật thuyết trình.
- Tuyệt đối KHÔNG BAO GIỜ dùng văn mẫu robot sáo rỗng hay trả lời rập khuôn. Mọi phản hồi đều tự nhiên, chân thành, sâu sắc và giàu tính thuyết phục.

CÁC NGUYÊN LÝ KIẾN TRÚC & LẬP LUẬN CAO CẤP:
1. Nguyên lý Kim tự tháp Minto (Minto Pyramid Principle): Đi từ thông điệp cốt lõi/kết luận đắt giá nhất ở đỉnh (Top-Down), sau đó phân rã thành các luận điểm hỗ trợ và dữ liệu minh chứng theo mô hình SCQA (Situation -> Complication -> Question -> Answer).
2. Nguyên tắc MECE (Mutually Exclusive, Collectively Exhaustive): Các luận điểm và phân mục không trùng lặp, bao quát toàn diện bài toán.
3. Mô hình McKinsey 7S: Đánh giá đồng bộ Chiến lược (Strategy), Cấu trúc (Structure), Hệ thống (Systems), Giá trị chia sẻ (Shared Values), Kỹ năng (Skills), Phong cách (Style), Nhân sự (Staff).
4. Cấu trúc lập luận Toulmin: Đảm bảo 6 thành tố: Claim (Luận đề) -> Data/Grounds (Dữ liệu bằng chứng) -> Warrant (Cơ sở bảo đảm) -> Backing (Hậu thuẫn) -> Qualifier (Mức độ khẳng định) -> Rebuttal (Phản biện dự phòng).
5. Mô hình dạy học 5E chuẩn Sư phạm 2026: Gắn kết (Engage) -> Khám phá (Explore) -> Giải thích (Explain) -> Củng cố & Mở rộng (Elaborate) -> Đánh giá (Evaluate).
6. Thang đo nhận thức Bloom (Bloom's Taxonomy 6 bậc): Nhớ -> Hiểu -> Vận dụng -> Phân tích -> Đánh giá -> Sáng tạo.

HAI CHẾ ĐỘ TÍNH CÁCH ĐẶC BIỆT:
1. CHẾ ĐỘ BẠN BÈ VUI VẺ (FRIEND MODE):
   - Nói chuyện như bạn thân tri kỷ, dí dỏm, thông minh, ấm áp và thấu hiểu.
   - Xưng hô thân mật: 'mình - bạn' hoặc 'tớ - cậu'.
   - Biến mọi khái niệm trừu tượng, khô khan thành cực kỳ dễ hiểu qua ví dụ đời thường sinh động.
2. CHẾ ĐỘ NGƯỜI LỚN NGHIÊM TÚC (MENTOR / SENIOR MODE):
   - Phong thái giáo sư cố vấn từng trải, đĩnh đạc, logic sắc bén và tư duy đa chiều.
   - Luận điểm gãy gọn, phân tích nhân quả biện chứng, định hướng bài bản cho chiến lược và sự nghiệp.

ĐẶC TÍNH CÁC PERSONA MÔ HÌNH NƠ-RON CỤC BỘ:
- Google Gemma 4 E2B: Flagship Google DeepMind, suy luận kiến trúc đa tầng, chiều sâu học thuật, chuẩn xác toán lý.
- Alibaba Qwen 2.5 0.5B: Lập dàn ý phân tích sắc sảo, sư phạm rõ ràng, cân bằng hoàn hảo giữa tốc độ và chiều sâu.
- SmolLM2-135M: Tốc độ phản hồi cực nhanh, cô đọng, súc tích, cấu trúc mạch lạc tối đa.

QUY TẮC SLIDE (BẮT BUỘC):
- Xuất đúng chính xác số lượng slide yêu cầu (3 - 60 slide), không dừng giữa chừng.
- Trả về bắt đầu bằng 'SLIDE_JSON:' kèm mảng JSON chuẩn xác.""".strip()

DESIGN_PLAYBOOK = """PLAYBOOK THIẾT KẾ SLIDE CHUẨN ĐẲNG CẤP QUỐC TẾ:
- Nguyên tắc One Core Message: Mỗi trang slide chỉ tập trung 1 thông điệp đắt giá nhất.
- Bố cục thị giác phân tầng (Visual Hierarchy), tương phản cao, tối ưu tỷ lệ vàng Phi = 1.618.
- 7 Archetype bố cục linh hoạt:
  * cards: Lưới thẻ thông tin phân nhánh tương tác đa chiều.
  * split: Phân tách 2 vế đối sánh / luận cứ phân tích và giải pháp.
  * metrics: Chỉ số định lượng KPI/ROI nổi bật kèm nhãn đo lường và tiến độ.
  * timeline: Lộ trình triển khai theo từng giai đoạn và mốc nghiệm thu.
  * matrix: Ma trận 2x2 đa chiều (SWOT, Eisenhower, Impact vs Effort).
  * comparison: Đối lập trực diện Thực trạng/Nỗi đau vs Giải pháp/Đột phá.
  * standard: Chuẩn bài giảng tinh gọn với thẻ tóm tắt và ghi chú chuyên sâu.
- Quy tắc 6x6: Tối đa 6 gạch đầu dòng, mỗi gạch tối đa 6-8 từ đắt giá cho slide tóm lược.
- Kịch bản diễn giả (Speaker Notes): Viết hoàn chỉnh kịch bản nói thực tế, truyền cảm hứng và hướng dẫn cách mở đầu (Hook).""".strip()

GOOGLE_MEDIA_GUIDE = """MEDIA & VISUAL INTEGRATION DIRECTIVE:
- Tự động gợi ý từ khóa tìm kiếm ảnh/video độ phân giải cao phù hợp với từng slide.
- Tích hợp tài liệu trực quan hoặc video clip ngắn (/media/video.mp4) tại các slide trọng điểm để thu hút sự chú ý.
- Đảm bảo hình ảnh mang tính minh chứng số liệu và bối cảnh thực tiễn, không dùng hình ảnh trừu tượng vô nghĩa.""".strip()

INDUSTRY_GUIDE = """HƯỚNG DẪN TIẾP CẬN TỪNG BỐI CẢNH & ĐỊNH DẠNG:
- Giáo án SGK Mới (KNTT / Cánh Diều / Chân Trời): Khởi động -> Khám phá -> Luyện tập -> Vận dụng thực tiễn (Mô hình 5E).
- Kế hoạch kinh doanh (Business Plan): Thị trường -> Nỗi đau -> Giải pháp -> Mô hình tài chính / ROI -> Lộ trình thực thi (Minto & 7S).
- Phân tích SWOT: Ma trận 4 góc Điểm mạnh (Strengths) -> Điểm yếu (Weaknesses) -> Cơ hội (Opportunities) -> Thách thức (Threats).
- Thuyết trình thang máy (Elevator Pitch 60s): Hook -> Pain Point -> Solution -> Traction/KPI -> Call To Action.
- Phân tích khoa học (Scientific Breakdown): Luận đề -> Cơ chế vi mô -> Dữ liệu thực nghiệm -> Ứng dụng thực tiễn.""".strip()

OUTPUT_CONTRACT = """OUTPUT CONTRACT:
- Bắt đầu bằng: SLIDE_JSON:
- Đảm bảo JSON hợp lệ 100%, đủ đúng số lượng slide yêu cầu.
- Mỗi slide chứa đầy đủ các trường: category, layout (cards|split|metrics|timeline|matrix|comparison|standard), title, subtitle/content, bullets, concept1, concept2, kpi_metrics (nếu có), speaker_note, animation_style.""".strip()


class DailyLearningStore:
	"""Lưu trữ và truy xuất bài học có kiểm soát, hỗ trợ học tập liên tục không cần mạng ngoại vi."""

	def __init__(self, path: str | Path | None = None) -> None:
		self.path = Path(path or os.getenv("AI_LEARNING_FILE", Path(__file__).with_name("learning.json")))

	def _read(self) -> dict[str, list[dict[str, str]]]:
		try:
			return json.loads(self.path.read_text(encoding="utf-8"))
		except (FileNotFoundError, json.JSONDecodeError):
			return {}

	def add(self, lesson: str, source: str = "user-feedback", category: str = "style-directive") -> dict[str, str]:
		lesson = " ".join(lesson.split())[:2000]
		if not lesson:
			raise ValueError("Bài học không được để trống.")
		data = self._read()
		day = date.today().isoformat()
		entry = {
			"lesson": lesson,
			"source": source[:120],
			"category": category[:50],
			"created_at": datetime.now(timezone.utc).isoformat()
		}
		data.setdefault(day, []).insert(0, entry)
		self.path.parent.mkdir(parents=True, exist_ok=True)
		self.path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
		return entry

	def recent(self, days: int = 14, limit: int = 30) -> list[dict[str, str]]:
		data = self._read()
		items = []
		for day in sorted(data.keys(), reverse=True)[:max(1, days)]:
			items.extend(data.get(day, []))
		return items[:max(1, limit)]

	def prompt_context(self) -> str:
		lessons = self.recent(days=30, limit=20)
		if not lessons:
			return "Chưa có bài học bổ sung từ người dùng."
		return "\n".join(f"- [{item.get('category', 'quy-tắc')}] {item['lesson']}" for item in lessons)

	def status(self) -> dict[str, Any]:
		all_lessons = self.recent(days=365, limit=10000)
		return {
			"file": str(self.path),
			"lessons": len(all_lessons),
			"updated_at": datetime.now(timezone.utc).isoformat(),
		}


class ContinuousLearning:
	"""Làm mới bộ nhớ kiến thức học tập định kỳ."""

	def __init__(self, store: DailyLearningStore, minute_interval: int = 60) -> None:
		self.store = store
		self.minute_interval = max(60, minute_interval)
		self._task: asyncio.Task[None] | None = None
		self.last_refresh = datetime.now(timezone.utc)

	async def _loop(self) -> None:
		while True:
			await asyncio.sleep(self.minute_interval)
			self.store.recent()
			self.last_refresh = datetime.now(timezone.utc)

	def start(self) -> None:
		if self._task is None or self._task.done():
			self._task = asyncio.create_task(self._loop())

	async def stop(self) -> None:
		if self._task and not self._task.done():
			self._task.cancel()
			try:
				await self._task
			except asyncio.CancelledError:
				pass

	def status(self) -> dict[str, Any]:
		return {"running": bool(self._task and not self._task.done()), "interval_seconds": self.minute_interval, "last_refresh": self.last_refresh.isoformat()}


class PexelsMediaSearch:
	"""Tìm kiếm hình ảnh và video tư liệu phục vụ thiết kế slide."""

	def __init__(self) -> None:
		self.api_key = os.getenv("PEXELS_API_KEY", "").strip()

	def _get_json(self, url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
		request = Request(url, headers=headers or {"User-Agent": "SlideCraft/1.0"})
		with urlopen(request, timeout=12) as response:
			return json.loads(response.read().decode("utf-8"))

	def images(self, query: str, limit: int = 8, page: int = 1) -> list[dict[str, Any]]:
		if not self.api_key:
			return []
		page = max(1, min(10, page))
		per_page = min(max(limit, 1), 15)
		params = urlencode({"query": query, "per_page": str(per_page), "page": str(page)})
		try:
			data = self._get_json(f"https://api.pexels.com/v1/search?{params}", {"User-Agent": "SlideCraft/1.0", "Authorization": self.api_key})
			return [{"title": item.get("photographer", "Pexels photo"), "url": item.get("src", {}).get("original", ""), "thumbnail": item.get("src", {}).get("medium", "") or item.get("src", {}).get("large", ""), "source": "pexels.com"} for item in data.get("photos", [])]
		except Exception:
			return []

	def videos(self, query: str, limit: int = 8, page: int = 1) -> list[dict[str, Any]]:
		if not self.api_key:
			return []
		page = max(1, min(10, page))
		per_page = min(max(limit, 1), 15)
		params = urlencode({"query": query, "per_page": str(per_page), "page": str(page)})
		try:
			data = self._get_json(f"https://api.pexels.com/videos/search?{params}", {"User-Agent": "SlideCraft/1.0", "Authorization": self.api_key})
			items = []
			for item in data.get("videos", []):
				best = item.get("video_files") or []
				video_url = next((v.get("link", "") for v in best if isinstance(v, dict) and v.get("link")), "")
				thumb = item.get("thumbnail") or (best[0].get("thumbnail") if best else "")
				items.append({
					"title": item.get("user", {}).get("name", "Pexels video"),
					"url": video_url,
					"thumbnail": thumb,
					"source": "pexels.com",
				})
			return items
		except Exception:
			return []

GoogleMediaSearch = PexelsMediaSearch


class SlideCraftAI:
	"""Bộ điều khiển suy luận AI và tổng hợp bài thuyết trình SlideCraft."""

	def __init__(self, client: Any, preferred_model: str = "", learning: DailyLearningStore | None = None) -> None:
		self.client = client
		self.preferred_model = preferred_model.strip()
		self.learning = learning or DailyLearningStore()

	def choose_model(self) -> str:
		available = {model.id for model in self.client.models.list().data}
		if self.preferred_model and self.preferred_model in available:
			return self.preferred_model

		preferred = (
			"openai/gpt-oss-20b",
			"llama-4-scout-17b-16e-instruct",
			"qwen/qwen3-32b",
			"llama-3.3-70b-versatile",
			"llama-3.1-8b-instant",
		)
		for model_id in preferred:
			if model_id in available:
				return model_id
		raise RuntimeError("Không có mô hình trò chuyện khả dụng.")

	def _infer_task_focus(self, message: str) -> str:
		lower = message.lower()
		if any(k in lower for k in ["giáo án", "tiết học", "kntt", "cánh diều", "chân trời", "sinh học", "toán", "vật lý", "hóa học"]):
			return "Đối tượng: Giáo dục & Sư phạm 2026. Ưu tiên mô hình 5E, chuẩn hóa 3 bộ SGK Mới, câu hỏi phân hóa theo thang Bloom."
		if any(k in lower for k in ["kế hoạch kinh doanh", "business plan", "pitch", "gọi vốn", "startup", "swot", "7s"]):
			return "Đối tượng: Chiến lược doanh nghiệp / C-Suite. Ưu tiên cấu trúc Minto, MECE, McKinsey 7S, ma trận SWOT, chỉ số KPI/ROI rõ ràng."
		if any(k in lower for k in ["marketing", "growth", "brand", "quảng cáo", "seo", "funnel"]):
			return "Đối tượng: Marketing & Growth. Ưu tiên kênh tiếp cận, chân dung khách hàng, phễu chuyển đổi, KPI tăng trưởng."
		if any(k in lower for k in ["khoa học", "kỹ thuật", "công nghệ", "kiến trúc", "hệ thống", "ai"]):
			return "Đối tượng: STEM & Công nghệ cao. Ưu tiên phân tích cơ chế, sơ đồ kiến trúc, dữ liệu định lượng và luận điểm Toulmin."
		return "Đối tượng: Đa lĩnh vực chuẩn hóa. Ưu tiên Kim tự tháp Minto, 7 layout trực quan, chỉ số định lượng và speaker notes truyền cảm hứng."

	def build_messages(self, message: str, history: Iterable[Any]) -> list[dict[str, str]]:
		learned = self.learning.prompt_context()
		task_focus = self._infer_task_focus(message)
		messages = [{
			"role": "system",
			"content": (
				f"{SYSTEM_PROMPT}\n\n{DESIGN_PLAYBOOK}\n\n{GOOGLE_MEDIA_GUIDE}\n\n{OUTPUT_CONTRACT}\n\n{INDUSTRY_GUIDE}\n\n"
				f"TASK FOCUS:\n{task_focus}\n\n"
				f"QUALITY GATES:\n- Mỗi slide tập trung 1 thông điệp cốt lõi (Minto Principle).\n"
				f"- Cấu trúc MECE không trùng lặp, đầy đủ luận chứng Toulmin.\n"
				f"- Áp dụng 7 bố cục linh hoạt: cards, split, metrics, timeline, matrix, comparison, standard.\n"
				f"- Luôn có số liệu kiểm định thực tế hoặc KPI định lượng rõ ràng.\n"
				f"- Speaker notes đầy đủ lời thoại mở đầu lôi cuốn và tương tác thính giả.\n\n"
				f"BÀI HỌC GHI NHỚ GẦN ĐÂY:\n{learned}"
			)
		}]
		for item in list(history)[-10:]:
			role = getattr(item, "role", "")
			content = getattr(item, "content", "")
			if role in {"user", "assistant"} and content:
				messages.append({"role": role, "content": content[:12000]})
		messages.append({"role": "user", "content": message})
		return messages

	def chat(self, message: str, history: Iterable[Any]) -> tuple[str, str]:
		model = self.choose_model()
		completion = self.client.chat.completions.create(
			model=model,
			messages=self.build_messages(message, history),
			temperature=0.35,
			max_tokens=4200,
		)
		reply = (completion.choices[0].message.content or "").strip()
		if not reply:
			raise RuntimeError("Hệ thống trả về nội dung rỗng.")
		return reply, model
