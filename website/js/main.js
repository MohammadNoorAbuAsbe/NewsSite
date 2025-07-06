document.addEventListener("DOMContentLoaded", fetchTopHeadlines);
(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
      if ($(window).width() > 992) {
        $(".navbar .dropdown")
          .on("mouseover", function () {
            $(".dropdown-toggle", this).trigger("click");
          })
          .on("mouseout", function () {
            $(".dropdown-toggle", this).trigger("click").blur();
          });
      } else {
        $(".navbar .dropdown").off("mouseover").off("mouseout");
      }
    }
    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
  });

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Main News carousel
  $(".main-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    items: 1,
    dots: true,
    loop: true,
    center: true,
  });

  // Tranding carousel
  $(".tranding-carousel").owlCarousel({
    autoplay: true,
    smartSpeed: 2000,
    items: 1,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="fa fa-angle-left"></i>',
      '<i class="fa fa-angle-right"></i>',
    ],
  });

  // Carousel item 1
  $(".carousel-item-1").owlCarousel({
    autoplay: true,
    smartSpeed: 1500,
    items: 1,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>',
    ],
  });

  // Carousel item 2
  $(".carousel-item-2").owlCarousel({
    autoplay: true,
    smartSpeed: 1000,
    margin: 30,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
    },
  });

  // Carousel item 3
  $(".carousel-item-3").owlCarousel({
    autoplay: true,
    smartSpeed: 1000,
    margin: 30,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
    },
  });

  // Carousel item 4
  $(".carousel-item-4").owlCarousel({
    autoplay: true,
    smartSpeed: 1000,
    margin: 30,
    dots: false,
    loop: true,
    nav: true,
    navText: [
      '<i class="fa fa-angle-left" aria-hidden="true"></i>',
      '<i class="fa fa-angle-right" aria-hidden="true"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 4,
      },
    },
  });
})(jQuery);

/////////////////////////////////////////////////////////////////////////////////////////////////////

function renderNewsFeed(articles) {
  const list = document.getElementById("news-articles-list");
  list.innerHTML = "";
  if (!articles || articles.length === 0) {
    list.innerHTML = '<div class="col-12"><p>No news articles found.</p></div>';
    return;
  }
  articles.forEach((article) => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";
    col.innerHTML = `
            <div class="card h-100">
                <img src="${
                  article.urlToImage || "img/news-700x435-1.jpg"
                }" class="card-img-top" alt="News Image">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${article.title || ""}</h5>
                    <p class="card-text">${article.description || ""}</p>
                    <a href="${
                      article.url
                    }" target="_blank" class="mt-auto btn btn-primary btn-sm">Read More</a>
                </div>
            </div>
        `;
    list.appendChild(col);
  });
}

function fetchTopHeadlines() {
  ajaxCall(
    "GET",
    urls.news.topHeadlinesUS,
    null,
    function (data) {
      renderNewsFeed(data.articles);
    },
    function () {
      document.getElementById("news-articles-list").innerHTML =
        '<div class="col-12"><p>Failed to load news articles.</p></div>';
    }
  );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
