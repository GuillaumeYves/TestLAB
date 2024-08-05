// Constants
const booksPerPage = 12; // Load 12 books
let currentPage = 1;
let filteredBooks = []; // Local array to store the books
let selectedBookIndex = null; // Store the index of the selected book for editing/deleting

// Elements
const totalBooksCountElement = document.getElementById("totalBooksCount");
const latestBooksContainer = document.getElementById("latestBooks");
const booksGridContainer = document.getElementById("booksGrid");
const loadMoreButton = document.getElementById("loadMoreButton");
const searchInput = document.getElementById("searchInput");

// Fetch books from Open Library
async function fetchBooks() {
  try {
    const response = await fetch(
      "https://openlibrary.org/subjects/love.json?limit=200"
    );
    const data = await response.json();
    const books = data.works.map((book) => ({
      title: book.title,
      author: book.authors
        ? book.authors.map((a) => a.name).join(", ")
        : "Unknown Author",
      date: book.created
        ? new Date(book.created).toLocaleDateString()
        : "Unknown Date",
      image: book.cover_id
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : "https://via.placeholder.com/150",
      description: book.first_sentence
        ? book.first_sentence[0]
        : "No description available.",
    }));
    return books;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

// Populate the latest books carousel
async function displayLatestBooks() {
  latestBooksContainer.innerHTML = "";

  // Sort books by date
  const latestBooks = filteredBooks
    .slice() // Create a copy of the array
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort descending
    .slice(0, 3); // Get the top 3 latest books

  latestBooks.forEach((book, index) => {
    const activeClass = index === 0 ? "active" : "";
    const bookItem = `
            <div class="carousel-item ${activeClass}">
                <div class="d-flex justify-content-center">
                    <div class="card" style="width: 18rem;" onclick="openModal(${filteredBooks.indexOf(
                      book
                    )})">
                        <img class="card-img-top" src="${book.image}" alt="${
      book.title
    }">
                        <div class="card-body">
                            <h5 class="card-title">${book.title}</h5>
                            <p class="card-text">By ${book.author}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    latestBooksContainer.innerHTML += bookItem;
  });
}

// Load all books into the grid
async function displayBooks(page) {
  const startIndex = (page - 1) * booksPerPage;
  const paginatedBooks = filteredBooks.slice(
    startIndex,
    startIndex + booksPerPage
  );

  booksGridContainer.innerHTML = ""; // Clear previous books
  paginatedBooks.forEach((book, index) => {
    const bookCard = `
            <div class="col-md-4 mb-3">
                <div class="card" onclick="openModal(${startIndex + index})">
                    <img class="card-img-top" src="${book.image}" alt="${
      book.title
    }">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">By ${book.author}</p>
                    </div>
                </div>
            </div>
        `;
    booksGridContainer.innerHTML += bookCard;
  });

  // Hide the load more button if there are no more books to load
  if (
    paginatedBooks.length < booksPerPage ||
    startIndex + booksPerPage >= filteredBooks.length
  ) {
    loadMoreButton.style.display = "none";
  } else {
    loadMoreButton.style.display = "block";
  }

  // Update total books count
  totalBooksCountElement.innerText = `(Currently there are ${filteredBooks.length} books to choose from)`;
}

// Load more books when the button is clicked
loadMoreButton.addEventListener("click", function () {
  currentPage++;
  displayBooks(currentPage);
});

let currentBookIndex;

// Function to open modal
function openModal(index) {
  currentBookIndex = index;
  const book = filteredBooks[index];

  document.getElementById("modalBookTitle").innerText = book.title;
  document.getElementById("modalBookAuthor").innerText = `By ${book.author}`;
  document.getElementById(
    "modalBookDate"
  ).innerText = `Published on: ${book.date}`;
  document.getElementById("modalBookImage").src = book.image;
  document.getElementById("modalBookDescription").innerText = book.description;

  $("#bookModal").modal("show");
}

// Edit book functionality
document.getElementById("editBookBtn").addEventListener("click", function () {
  const book = filteredBooks[currentBookIndex];

  // Open a prompt to edit title, author, and description
  const newTitle = prompt("Enter new title:", book.title);
  const newAuthor = prompt("Enter new author:", book.author);
  const newDescription = prompt("Enter new description:", book.description);

  if (newTitle) book.title = newTitle;
  if (newAuthor) book.author = newAuthor;
  if (newDescription) book.description = newDescription;

  // Update the carousel and the grid
  displayLatestBooks();
  resetDisplay();

  // Close modal
  $("#bookModal").modal("hide");
});

// Delete book functionality
document.getElementById("deleteBookBtn").addEventListener("click", function () {
  filteredBooks.splice(currentBookIndex, 1); // Remove book from array
  displayLatestBooks(); // Update the carousel
  resetDisplay(); // Refresh all book displays

  // Close modal
  $("#bookModal").modal("hide");
});

// Add book functionality
document.getElementById("addBookForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("bookTitle").value;
  const author = document.getElementById("bookAuthor").value;
  const date = document.getElementById("bookDate").value;
  const image = document.getElementById("bookImage").files[0];

  const reader = new FileReader();
  reader.onload = function (event) {
    const newBook = {
      title,
      author,
      date,
      image: event.target.result,
      description: "A new book added by the user.",
    };
    filteredBooks.unshift(newBook); // Add to the beginning of the array
    displayLatestBooks();
    resetDisplay(); // Reset display to show the first page of books
    this.reset(); // Reset form
  };
  reader.readAsDataURL(image);
});

// Search functionality
searchInput.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  filteredBooks = filteredBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
  );

  // Reset to first page and clear previous results
  currentPage = 1;
  booksGridContainer.innerHTML = "";
  displayBooks(currentPage);
});

// Reset display to show the first page
function resetDisplay() {
  currentPage = 1;
  booksGridContainer.innerHTML = "";
  displayBooks(currentPage);
}

// Initial display
async function init() {
  filteredBooks = await fetchBooks(); // Fetch books from API and store in local array
  await displayLatestBooks(); // Display latest books
  await displayBooks(currentPage); // Display all books for the first page
}

init();
