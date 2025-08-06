// Reusable Pagination Component for NewsSite
class PaginationManager {
  constructor(containerId, onPageChange) {
    this.containerId = containerId;
    this.onPageChange = onPageChange;
    this.currentPage = 1;
    this.totalPages = 1;
    this.maxVisiblePages = 5;
  }

  /**
   * Updates the pagination display
   * @param {number} currentPage - Current page number
   * @param {number} totalPages - Total number of pages
   */
  update(currentPage, totalPages) {
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.render();
  }

  /**
   * Renders the pagination HTML
   */
  render() {
    const $container = $("#" + this.containerId);
    if (!$container.length || this.totalPages <= 1) {
      if ($container.length) $container.html("");
      return;
    }

    let paginationHTML =
      '<nav aria-label="ניווט דפים"><ul class="pagination justify-content-center">';

    // Previous button
    paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${
                  this.currentPage - 1
                }">
                    <i class="fas fa-chevron-right me-1"></i>הקודם
                </a>
            </li>
        `;

    // Calculate page range
    const startPage = Math.max(
      1,
      this.currentPage - Math.floor(this.maxVisiblePages / 2)
    );
    const endPage = Math.min(
      this.totalPages,
      startPage + this.maxVisiblePages - 1
    );

    // First page and ellipsis
    if (startPage > 1) {
      paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `;
      if (startPage > 2) {
        paginationHTML +=
          '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
                <li class="page-item ${i === this.currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    // Last page and ellipsis
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        paginationHTML +=
          '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
      paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a>
                </li>
            `;
    }

    // Next button
    paginationHTML += `
            <li class="page-item ${
              this.currentPage === this.totalPages ? "disabled" : ""
            }">
                <a class="page-link" href="#" data-page="${
                  this.currentPage + 1
                }">
                    הבא<i class="fas fa-chevron-left ms-1"></i>
                </a>
            </li>
        `;

    paginationHTML += "</ul></nav>";

    $container.html(paginationHTML);

    // Add click event listeners
    $container.off("click").on("click", (e) => {
      e.preventDefault();
      const link = $(e.target).closest(".page-link");
      if (link.length && !link.closest(".page-item").hasClass("disabled")) {
        const page = parseInt(link.attr("data-page"));
        if (
          page &&
          page !== this.currentPage &&
          page >= 1 &&
          page <= this.totalPages
        ) {
          this.changePage(page);
        }
      }
    });
  }

  /**
   * Changes to a specific page
   * @param {number} page - Page number to change to
   */
  changePage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      if (this.onPageChange) {
        this.onPageChange(page);
      }
    }
  }

  /**
   * Goes to the next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  /**
   * Goes to the previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  /**
   * Goes to the first page
   */
  firstPage() {
    this.changePage(1);
  }

  /**
   * Goes to the last page
   */
  lastPage() {
    this.changePage(this.totalPages);
  }

  /**
   * Gets current page info
   * @returns {Object} Current page information
   */
  getPageInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      hasNext: this.currentPage < this.totalPages,
      hasPrevious: this.currentPage > 1,
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaginationManager;
}
