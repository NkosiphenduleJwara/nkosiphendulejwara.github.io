/*
 * LinkedIn posts shown in "Recent Updates", newest first.
 * To add one: on LinkedIn open the post's "..." menu > "Embed this post", copy the
 * full urn from the embed src (urn:li:activity:, urn:li:share: or urn:li:ugcPost:...),
 * and add an entry at the TOP.
 * height: embeds can't auto-size, so match roughly what the embed dialog suggests.
 */
window.LINKEDIN_POSTS = [
    { urn: 'urn:li:ugcPost:7505186270135042048', height: 1489 },
    { urn: 'urn:li:ugcPost:7487435514753519617', height: 1699 },
    { urn: 'urn:li:share:7478394175374233600', height: 1762 },
    { urn: 'urn:li:activity:7439203595771736064', height: 1700 }
];

(function () {
    var grid = document.getElementById('postsGrid');
    if (!grid) return;
    var posts = window.LINKEDIN_POSTS || [];
    var limit = parseInt(grid.getAttribute('data-limit') || '6', 10);

    posts.slice(0, limit).forEach(function (post, i) {
        var wrap = document.createElement('div');
        wrap.className = 'post-embed';
        var frame = document.createElement('iframe');
        frame.src = 'https://www.linkedin.com/embed/feed/update/' + post.urn;
        frame.height = String(post.height || 900);
        frame.loading = i === 0 ? 'eager' : 'lazy';
        frame.title = 'LinkedIn post ' + (i + 1) + ' by Nkosiphendule Jwara';
        frame.setAttribute('allowfullscreen', '');
        wrap.appendChild(frame);
        grid.appendChild(wrap);
    });
})();
