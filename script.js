const booksPerPage = 3; // Load default of 12 books
let currentPage = 1;
let filteredBooks = []; // Local array to store the books
let allBooks = []; // Store the original list of books
let selectedBookIndex = null; // Store the index of the selected book for editing/deleting

// Elements
const latestBooksContainer = document.getElementById("latestBooks");
const booksGridContainer = document.getElementById("booksGrid");
const loadMoreButton = document.getElementById("loadMoreButton");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreSelect");

// Fetch books for a specific subject
async function fetchBooksBySubject(subject) {
  try {
    const response = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=200`
    );
    const data = await response.json();

    // Log the response data to inspect its structure
    console.log(data);

    // Check if works exist in the data
    if (!data.works || data.works.length === 0) {
      console.error("No works found in the response");
      return [];
    }

    const books = data.works.map((book) => ({
      title: book.title,
      author:
        book.authors && book.authors.length > 0
          ? book.authors.map((a) => a.name).join(", ")
          : "Unknown Author",
      date: book.first_publish_year
        ? book.first_publish_year.toString()
        : "Unknown Date",
      genre: data.name || "Unknown Genre", // Use the subject name as the genre
      image: book.cover_id
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : "https://via.placeholder.com/150",
      description:
        book.first_sentence && book.first_sentence.length > 0
          ? book.first_sentence[0]
          : "No description available.", // Check if first_sentence exists
    }));

    return books; // Return the list of books
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
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3); // Get 3 latest books

  latestBooks.forEach((book, index) => {
    const activeClass = index === 0 ? "active" : "";
    const bookItem = `
      <div class="carousel-item ${activeClass}">
        <div class="d-flex justify-content-center">
          <div class="card" style="width: 18rem;" onclick="openModal(${filteredBooks.indexOf(
            book
          )})">
            <img class="card-img-top" src="${book.image}" alt="${book.title}">
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
      <div class="col-md-4 mb-3" id="gridBook">
        <div onclick="openModal(${
          startIndex + index
        })" style="display: flex; flex-direction: column; align-items: center;">
          <img class="card-img-top" src="${book.image}" alt="${
      book.title
    }" style="width: 200px; height: 300px; object-fit: cover; margin: 10px;">
        </div>
      </div>
    `;
    booksGridContainer.innerHTML += bookCard;
  });

  // Hide the load more button if there are no more books to load
  loadMoreButton.style.display =
    paginatedBooks.length < booksPerPage ||
    startIndex + booksPerPage >= filteredBooks.length
      ? "none"
      : "block";
}

// Load 3 more books when the button is clicked
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
  ).innerText = `Publication Date: ${book.date}`;
  document.getElementById("modalBookImage").src = book.image;
  document.getElementById("modalBookDescription").innerText = book.description;
  document.getElementById("modalBookGenre").innerText = `Genre: ${book.genre}`;

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
      genre: "Adventure",
      description: "That's your book!",
    };
    filteredBooks.unshift(newBook); // Add to the beginning of the array
    allBooks.unshift(newBook); // Also add to the original list
    displayLatestBooks();
    resetDisplay(); // Reset display to show the first page of books
    this.reset(); // Reset form
  };
  reader.readAsDataURL(image);
});

// Search functionality
searchInput.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const selectedGenre = genreSelect.value; // Get selected genre

  // Filter books based on title, author, or selected genre
  filteredBooks = allBooks.filter(
    (book) =>
      (book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)) &&
      (selectedGenre === "" ||
        book.genre.toLowerCase().includes(selectedGenre.toLowerCase()))
  );

  // Reset to the first page and clear previous results
  currentPage = 1;
  resetDisplay(); // Reset display to show the first page of books
});

// Reset display to show the first page
function resetDisplay() {
  currentPage = 1;
  booksGridContainer.innerHTML = "";
  displayBooks(currentPage);
}

// Initialize the app
async function init() {
  filteredBooks = await fetchBooksBySubject("love"); // Fetch books for a default subject initially
  allBooks = filteredBooks; // Store the original list of books
  await displayLatestBooks(); // Display latest books
  await displayBooks(currentPage); // Display all books for the first page
}

// Genre filter change
genreSelect.addEventListener("change", async function () {
  const selectedSubject = this.value; // Get the selected subject

  // If the selected subject is empty show all books
  if (selectedSubject === "") {
    filteredBooks = allBooks; // Reset to all books if placeholder is selected
  } else {
    filteredBooks = await fetchBooksBySubject(selectedSubject); // Fetch books for the selected subject
    allBooks = filteredBooks; // Update all books with the newly fetched ones
  }

  resetDisplay();
});

// Initialize
init();
