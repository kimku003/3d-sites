// Shared project card renderer for kimportfolio.html (limit) and projets.html (all)
// ponytail: one renderer, both pages call window.renderProjects(container, limit)
(function () {
    var catColors = {
        Fullstack: { badge: 'bg-indigo-600', tech: 'bg-indigo-900', link: 'text-indigo-400', hover: 'text-indigo-300' },
        Frontend: { badge: 'bg-purple-600', tech: 'bg-purple-900', link: 'text-purple-400', hover: 'text-purple-300' },
        Backend: { badge: 'bg-pink-600', tech: 'bg-pink-900', link: 'text-pink-400', hover: 'text-pink-300' }
    };

    var renderCard = function (p) {
        var c = catColors[p.category] || catColors.Fullstack;
        var header = '';
        if (p.image) {
            var dim = p.imgWidth ? ' width="' + p.imgWidth + '" height="' + p.imgHeight + '"' : '';
            header = '<img src="' + p.image + '?v=219ba9a" alt="' + p.name + '"' + dim + ' class="w-full h-full object-cover"><div class="absolute inset-0 from-slate-900 to-transparent"></div>';
        } else if (p.gradient) {
            header = '<div class="absolute inset-0 bg-gradient-to-br from-' + p.gradient.from + ' to-' + p.gradient.to + ' flex items-center justify-center"><i class="' + p.gradient.icon + ' text-6xl ' + p.gradient.iconColor + ' opacity-40"></i></div>';
        }
        var techHtml = p.tech.map(function (t) {
            return '<span class="px-2 py-1 ' + c.tech + ' bg-opacity-50 rounded text-xs">' + t + '</span>';
        }).join('');
        var urlHtml = p.url
            ? '<a href="' + p.url + '" target="_blank" rel="noopener" class="' + c.link + ' hover:' + c.hover + ' text-sm font-medium flex items-center whitespace-nowrap">Voir le projet <i class="fas fa-arrow-right ml-2"></i></a>'
            : '<a href="#" class="' + c.link + ' hover:' + c.hover + ' text-sm font-medium flex items-center">Voir le projet <i class="fas fa-arrow-right ml-2"></i></a>';
        var detailsHtml = '';
        if (p.details) {
            detailsHtml = '<div class="mt-4 text-sm text-gray-300 space-y-2"><div><span class="font-semibold">Problème:</span> ' + p.details.problem + '</div><div><span class="font-semibold">Solution:</span> ' + p.details.solution + '</div><div><span class="font-semibold">Impact:</span> ' + p.details.impact + '</div></div>';
        }
        return '<div class="project-card bg-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full"><div class="relative h-48 overflow-hidden flex-shrink-0">' + header + '<div class="absolute top-4 right-4"><span class="px-3 py-1 ' + c.badge + ' rounded-full text-xs font-semibold">' + p.category + '</span></div></div><div class="p-6 flex flex-col flex-grow"><h3 class="text-xl font-bold mb-2">' + p.name + '</h3><p class="text-gray-400 text-sm mb-4 flex-grow">' + p.description + '</p><div class="flex flex-wrap gap-2 mb-4">' + techHtml + '</div>' + detailsHtml + '<div class="flex justify-between items-center mt-auto">' + urlHtml + '<a href="#" class="text-gray-400 hover:text-gray-300" aria-label="GitHub de ' + p.name + '"><i class="fab fa-github"></i></a></div></div></div>';
    };

    // Private repo alert: placeholder links (# or javascript:) open the alert instead
    var isPlaceholderLink = function (a) {
        if (!a) return true;
        var href = a.getAttribute('href');
        if (!href) return true;
        var trimmed = href.trim();
        return trimmed === '#' || trimmed.toLowerCase().startsWith('javascript:');
    };

    var showPrivateAlert = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert('Ce projet est dans un dépôt privé, veuillez me contacter pour en savoir plus');
    };

    var wirePrivateAlerts = function (container) {
        container.querySelectorAll('.project-card').forEach(function (card) {
            var links = Array.from(card.querySelectorAll('a'));
            var viewLink = links.find(function (a) { return a.textContent && a.textContent.trim().startsWith('Voir le projet'); });
            var githubIcon = card.querySelector('a .fa-github');
            var githubLink = githubIcon ? githubIcon.closest('a') : null;

            [viewLink, githubLink].forEach(function (link) {
                if (isPlaceholderLink(link)) {
                    // Use capture to ensure this runs before other click handlers (e.g., smooth scroll)
                    link.addEventListener('click', showPrivateAlert, true);
                }
            });
            // Make the main image clickable to open the primary link
            var imageEl = card.querySelector('.relative img');
            if (imageEl && viewLink) {
                imageEl.style.cursor = 'pointer';
                imageEl.addEventListener('click', function (e) {
                    // Prefer direct open to avoid the placeholder alert for real links
                    if (isPlaceholderLink(viewLink)) {
                        showPrivateAlert(e);
                    } else {
                        var target = viewLink.getAttribute('target') || '_self';
                        window.open(viewLink.href, target);
                    }
                });
            }
        });
    };

    // limit: undefined = render all projects; number = render the first N
    window.renderProjects = async function (container, limit) {
        try {
            var resp = await fetch('projects.json?v=219ba9a');
            var projects = await resp.json();
            if (limit) projects = projects.slice(0, limit);
            container.innerHTML = projects.map(renderCard).join('');
            wirePrivateAlerts(container);
        } catch (e) {
            console.error('Failed to load projects:', e);
        }
    };
})();
