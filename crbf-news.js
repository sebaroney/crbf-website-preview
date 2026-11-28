(() => {
  if (customElements.get('crbf-news-grid')) return;
  const root = '/crbf-website-preview/stories/';
  const gallery = 'https://www.crbf.org.au/wp-json/wp/v2/pages/4406?_fields=content';
  let pending;
  async function readGallery() {
    const response = await fetch(gallery, {credentials: 'omit'});
    if (!response.ok) throw new Error('Gallery unavailable');
    const page = await response.json();
    const template = document.createElement('template');
    template.innerHTML = page.content.rendered;
    const posts = [];
    for (const link of template.content.querySelectorAll('.crbf-ig__grid .crbf-ig__item a')) {
      const photo = link.querySelector('img');
      const post = /^https:\/\/www\.instagram\.com\/(p|reel)\/([\w-]+)\/?$/.exec(link.href);
      if (!post || !photo?.alt || !photo.src.startsWith('https://www.crbf.org.au/')) continue;
      posts.push({id: post[2], url: link.href, title: photo.alt, image: photo.src});
    }
    return posts;
  }
  function publishedPosts() {
    if (!pending) pending = readGallery().catch(() => { pending = null; return []; });
    return pending;
  }
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  class NewsGrid extends HTMLElement {
    async connectedCallback() {
      const posts = await publishedPosts();
      if (!this.isConnected) return;
      const existing = new Set(Array.from(this.querySelectorAll('[data-post]'), el => el.dataset.post));
      const additions = document.createDocumentFragment();
      for (const post of posts) {
        if (existing.has(post.id)) continue;
        existing.add(post.id);
        const link = element('a');
        link.dataset.post = post.id;
        link.href = root + 'post/?id=' + encodeURIComponent(post.id);
        const image = element('img', 'news-thumbnail');
        image.loading = 'lazy';
        image.alt = '';
        image.src = post.image;
        link.append(image, element('h3', '', post.title), element('span', 'text-link', 'Read story →'));
        additions.append(link);
      }
      this.prepend(additions);
    }
  }
  class NewsPost extends HTMLElement {
    async connectedCallback() {
      const id = new URLSearchParams(location.search).get('id');
      const post = (await publishedPosts()).find(item => item.id === id);
      if (!post || !this.isConnected) return;
      const heading = this.querySelector('h1');
      heading.textContent = post.title;
      document.title = post.title + ' | CRBF';
      const link = this.querySelector('.post-original');
      link.href = post.url;
      link.textContent = 'View the original Instagram post →';
      const frame = element('iframe', 'news-post-embed');
      frame.src = post.url.replace(/\/?$/, '/') + 'embed/captioned/';
      frame.title = post.title;
      this.querySelector('article').insertBefore(frame, link);
    }
  }
  // The public profile is rendered by Instagram. Keep it current when a visitor
  // returns to the page, and while the feed is on screen and not in use.
  class ProfileFeed extends HTMLElement {
    connectedCallback() {
      const frame = this.querySelector('iframe');
      if (!frame && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (this.isConnected) this.connectedCallback();
        }, {once: true});
        return;
      }
      if (!frame || this.timer) return;
      this.loadedAt = Date.now();
      let visible = false;
      this.observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      this.observer.observe(frame);
      this.refresh = () => {
        if (document.hidden || !visible || document.activeElement === frame ||
            Date.now() - this.loadedAt < 60000) return;
        this.loadedAt = Date.now();
        frame.src = 'https://www.instagram.com/crbfoundation/embed/';
      };
      document.addEventListener('visibilitychange', this.refresh);
      this.timer = window.setInterval(this.refresh, 60000);
    }
    disconnectedCallback() {
      this.observer?.disconnect();
      clearInterval(this.timer);
      this.timer = null;
      document.removeEventListener('visibilitychange', this.refresh);
    }
  }
  customElements.define('crbf-profile-feed', ProfileFeed);
  customElements.define('crbf-news-grid', NewsGrid);
  customElements.define('crbf-news-post', NewsPost);
})();