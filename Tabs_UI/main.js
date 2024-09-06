const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const tabs = $$(".tab-item");
const panes = $$(".tab-pane");

const tabActive = $(".tab-item.active");
const line = $(".tabs .line");

line.style.left = tabActive.offsetLeft + "px";
line.style.width = tabActive.offsetWidth + "px";

tabs.forEach((tab, index) => {
  const pane = panes[index];
  // Lắng nghe sự kiện onclick
  tab.onclick = function () {
    // Xóa class active hiện tại
    $(".tab-item.active").classList.remove("active");
    $(".tab-pane.active").classList.remove("active");
    //Lấy thông số left và width của element tab
    line.style.left = this.offsetLeft + "px";
    line.style.width = this.offsetWidth + "px";
    // Thêm class active vào element được click vào
    this.classList.add("active");
    pane.classList.add("active");
  };
});
