class CineSearchPro {
    constructor() {
        this.apiKey = 'YOUR_API_KEY_HERE'; 
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.searchCache = new Map();
        this.currentAbortController = null;
        this.searchInput = document.getElementById('searchInput');
        this.resultsList = document.getElementById('resultsList');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.movieDetailsContainer = document.getElementById('movieDetails');
        this.resultsCount = document.querySelector('.results-count');
        
        this.currentSelectedIndex = -1;
        this.currentResults = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.loadInitialMovies();
    }
    
    setupEventListeners() {
        let debounceTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.handleSearch(e.target.value.trim());
            }, 300);
        });
    }
    
    setupKeyboardNavigation() {
        this.searchInput.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateResults(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateResults(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.currentSelectedIndex >= 0 && this.currentResults[this.currentSelectedIndex]) {
                        this.selectMovie(this.currentResults[this.currentSelectedIndex]);
                    }
                    break;
            }
        });
    } }