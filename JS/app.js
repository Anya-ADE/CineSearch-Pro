class CineSearch {
    constructor() {
        this.cache = new Map();
        this.controller = null;
        this.timer = null;
        this.results = [];
        this.activeIndex = -1;
        this.term = '';
        
        this.app = document.querySelector('.app');
        this.input = document.getElementById('searchInput');
        this.resultsList = document.querySelector('.results-list');
        this.template = document.getElementById('movieTemplate');
        
        this.input.addEventListener('input', (e) => {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.search(e.target.value), 300);
        });
        
        this.input.addEventListener('keydown', (e) => {
            const items = document.querySelectorAll('.movie-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
                this.updateActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeIndex = Math.max(this.activeIndex - 1, 0);
                this.updateActive(items);
            } else if (e.key === 'Enter' && this.activeIndex >= 0) {
                this.selectMovie(this.results[this.activeIndex]);
            }
        });
        
        this.resultsList.addEventListener('click', (e) => {
            const item = e.target.closest('.movie-item');
            if (item) {
                const movie = this.results.find(m => m.id == item.dataset.id);
                if (movie) this.selectMovie(movie);
            }
        });
    }
    
    updateActive(items) {
        items.forEach((item, i) => {
            i === this.activeIndex ? item.classList.add('active') : item.classList.remove('active');
        });
    }
    
    async search(query) {
        this.term = query.trim();
        if (!this.term) return;
        
        if (this.cache.has(this.term)) {
            this.renderResults(this.cache.get(this.term));
            return;
        }
        
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        this.app.dataset.loading = 'true';
        
        try {
            const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(this.term)}`, 
                { signal: this.controller.signal });
            const data = await res.json();
            const results = data.results || [];
            this.cache.set(this.term, results);
            this.renderResults(results);
        } catch(e) {
            if (e.name !== 'AbortError') console.error(e);
        } finally {
            this.app.dataset.loading = 'false';
        }
    }
    
    renderResults(movies) {
        this.results = movies;
        this.activeIndex = -1;
        
        const fragment = new DocumentFragment();
        
        movies.forEach(movie => {
            const clone = this.template.content.cloneNode(true);
            const titleDiv = clone.querySelector('.movie-title');
            const yearDiv = clone.querySelector('.movie-year');
            
            titleDiv.appendChild(this.buildHighlightedTitle(movie.title));
            yearDiv.textContent = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
            clone.querySelector('.movie-item').dataset.id = movie.id;
            
            fragment.appendChild(clone);
        });
        
        this.resultsList.innerHTML = '';
        this.resultsList.appendChild(fragment);
    }
    
    buildHighlightedTitle(title) {
        const container = document.createElement('span');
        if (!this.term) {
            container.textContent = title;
            return container;
        }
        
        const idx = title.toLowerCase().indexOf(this.term.toLowerCase());
        if (idx === -1) {
            container.textContent = title;
            return container;
        }
        
        const before = document.createElement('span');
        const match = document.createElement('span');
        const after = document.createElement('span');
        
        before.textContent = title.slice(0, idx);
        match.textContent = title.slice(idx, idx + this.term.length);
        match.className = 'highlight';
        after.textContent = title.slice(idx + this.term.length);
        
        container.appendChild(before);
        container.appendChild(match);
        container.appendChild(after);
        return container;
    }
    
    async selectMovie(movie) {
        this.app.dataset.loading = 'true';
        
        const results = await Promise.allSettled([
            fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}`).then(r => r.ok ? r.json() : Promise.reject()),
            fetch(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`).then(r => r.ok ? r.json() : Promise.reject()),
            fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`).then(r => r.ok ? r.json() : Promise.reject())
        ]);
        
        document.getElementById('details').innerHTML = results[0].status === 'fulfilled' ? 
            `<h3>${results[0].value.title}</h3><p>${results[0].value.overview || ''}</p>` : 
            '<p>Details unavailable</p>';
        
        document.getElementById('credits').innerHTML = results[1].status === 'fulfilled' && results[1].value.cast ? 
            `<h3>Cast</h3><ul>${results[1].value.cast.slice(0,5).map(a => `<li>${a.name}</li>`).join('')}</ul>` : 
            '<p>Credits unavailable</p>';
        
        const trailer = results[2].status === 'fulfilled' && results[2].value.results?.length ? 
            results[2].value.results.find(v => v.type === 'Trailer') || results[2].value.results[0] : null;
        document.getElementById('videos').innerHTML = trailer ? 
            `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank">Watch Trailer</a>` : 
            '<p>No trailer</p>';
        
        this.app.dataset.loading = 'false';
    }
}

new CineSearch();