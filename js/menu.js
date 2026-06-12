(function () {
  "use strict";

  $(function () {
    $(".menu-container").load("menu.html", function() {
      document.dispatchEvent(new CustomEvent('menuLoaded'));
    });
  });

  // Category filtering functionality
  document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const publicationItems = document.querySelectorAll('.publication-item');

    // Function to filter publications
    function filterPublications(selectedCategory) {
      publicationItems.forEach(item => {
        const itemCategories = item.getAttribute('data-categories').split(' ');
        if (selectedCategory === 'all' || itemCategories.includes(selectedCategory)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    }

    // Set up click handlers for category buttons
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const selectedCategory = button.getAttribute('data-category');
        filterPublications(selectedCategory);
      });
    });

    // Show only selected publications by default
    filterPublications('selected');
  });

  document.addEventListener('DOMContentLoaded', function() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const storageKey = 'xy-nebula-theme';
    const canvas = document.createElement('canvas');
    const nestCanvas = document.createElement('canvas');
    const nestCtx = nestCanvas.getContext('2d');
    const toggle = document.createElement('button');
    let num = 200;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let _x = 0;
    let _y = 0;
    let _z = 150;
    let app = null;
    let nestApp = null;

    const dtr = function(d) {
      return d * Math.PI / 180;
    };

    const rnd = function() {
      return Math.sin(Math.floor(Math.random() * 360) * Math.PI / 180);
    };

    const cam = {
      obj: {
        x: _x,
        y: _y,
        z: _z
      },
      dest: {
        x: 0,
        y: 0,
        z: 1
      },
      dist: {
        x: 0,
        y: 0,
        z: 200
      },
      ang: {
        cplane: 0,
        splane: 0,
        ctheta: 0,
        stheta: 0
      },
      zoom: 1,
      disp: {
        x: w / 2,
        y: h / 2,
        z: 0
      },
      upd: function() {
        cam.dist.x = cam.dest.x - cam.obj.x;
        cam.dist.y = cam.dest.y - cam.obj.y;
        cam.dist.z = cam.dest.z - cam.obj.z;
        cam.ang.cplane = -cam.dist.z / Math.sqrt(cam.dist.x * cam.dist.x + cam.dist.z * cam.dist.z);
        cam.ang.splane = cam.dist.x / Math.sqrt(cam.dist.x * cam.dist.x + cam.dist.z * cam.dist.z);
        cam.ang.ctheta = Math.sqrt(cam.dist.x * cam.dist.x + cam.dist.z * cam.dist.z) / Math.sqrt(cam.dist.x * cam.dist.x + cam.dist.y * cam.dist.y + cam.dist.z * cam.dist.z);
        cam.ang.stheta = -cam.dist.y / Math.sqrt(cam.dist.x * cam.dist.x + cam.dist.y * cam.dist.y + cam.dist.z * cam.dist.z);
      }
    };

    const trans = {
      parts: {
        sz: function(p, sz) {
          return {
            x: p.x * sz.x,
            y: p.y * sz.y,
            z: p.z * sz.z
          };
        },
        rot: {
          x: function(p, rot) {
            return {
              x: p.x,
              y: p.y * Math.cos(dtr(rot.x)) - p.z * Math.sin(dtr(rot.x)),
              z: p.y * Math.sin(dtr(rot.x)) + p.z * Math.cos(dtr(rot.x))
            };
          },
          y: function(p, rot) {
            return {
              x: p.x * Math.cos(dtr(rot.y)) + p.z * Math.sin(dtr(rot.y)),
              y: p.y,
              z: -p.x * Math.sin(dtr(rot.y)) + p.z * Math.cos(dtr(rot.y))
            };
          },
          z: function(p, rot) {
            return {
              x: p.x * Math.cos(dtr(rot.z)) - p.y * Math.sin(dtr(rot.z)),
              y: p.x * Math.sin(dtr(rot.z)) + p.y * Math.cos(dtr(rot.z)),
              z: p.z
            };
          }
        },
        pos: function(p, pos) {
          return {
            x: p.x + pos.x,
            y: p.y + pos.y,
            z: p.z + pos.z
          };
        }
      },
      pov: {
        plane: function(p) {
          return {
            x: p.x * cam.ang.cplane + p.z * cam.ang.splane,
            y: p.y,
            z: p.x * -cam.ang.splane + p.z * cam.ang.cplane
          };
        },
        theta: function(p) {
          return {
            x: p.x,
            y: p.y * cam.ang.ctheta - p.z * cam.ang.stheta,
            z: p.y * cam.ang.stheta + p.z * cam.ang.ctheta
          };
        },
        set: function(p) {
          return {
            x: p.x - cam.obj.x,
            y: p.y - cam.obj.y,
            z: p.z - cam.obj.z
          };
        }
      },
      persp: function(p) {
        return {
          x: p.x * cam.dist.z / p.z * cam.zoom,
          y: p.y * cam.dist.z / p.z * cam.zoom,
          z: p.z * cam.zoom,
          p: cam.dist.z / p.z
        };
      },
      disp: function(p, disp) {
        return {
          x: p.x + disp.x,
          y: -p.y + disp.y,
          z: p.z + disp.z,
          p: p.p
        };
      },
      steps: function(_obj_, sz, rot, pos, disp) {
        let _args = trans.parts.sz(_obj_, sz);
        _args = trans.parts.rot.x(_args, rot);
        _args = trans.parts.rot.y(_args, rot);
        _args = trans.parts.rot.z(_args, rot);
        _args = trans.parts.pos(_args, pos);
        _args = trans.pov.plane(_args);
        _args = trans.pov.theta(_args);
        _args = trans.pov.set(_args);
        _args = trans.persp(_args);
        _args = trans.disp(_args, disp);
        return _args;
      }
    };

    const threeD = function(param) {
      this.transIn = {};
      this.transOut = {};
      this.transIn.vtx = param.vtx;
      this.transIn.sz = param.sz;
      this.transIn.rot = param.rot;
      this.transIn.pos = param.pos;
    };

    threeD.prototype.vupd = function() {
      this.transOut = trans.steps(
        this.transIn.vtx,
        this.transIn.sz,
        this.transIn.rot,
        this.transIn.pos,
        cam.disp
      );
    };

    const Build = function() {
      this.vel = 0.04;
      this.lim = 360;
      this.diff = 200;
      this.toX = _x;
      this.toY = _y;
      this.rafId = null;
      this.go();
    };

    Build.prototype.go = function() {
      this.canvas = canvas;
      this.canvas.width = w;
      this.canvas.height = h;
      this.$ = canvas.getContext('2d');
      this.$.globalCompositeOperation = 'source-over';
      this.varr = [];
      this.calc = [];

      for (let i = 0; i < num; i++) {
        this.add();
      }

      this.rotObj = {
        x: 0,
        y: 0,
        z: 0
      };
      this.objSz = {
        x: w / 5,
        y: h / 5,
        z: w / 5
      };
      cam.disp.x = w / 2;
      cam.disp.y = h / 2;
    };

    Build.prototype.add = function() {
      this.varr.push(new threeD({
        vtx: {
          x: rnd(),
          y: rnd(),
          z: rnd()
        },
        sz: {
          x: 0,
          y: 0,
          z: 0
        },
        rot: {
          x: 20,
          y: -20,
          z: 0
        },
        pos: {
          x: this.diff * Math.sin(360 * Math.random() * Math.PI / 180),
          y: this.diff * Math.sin(360 * Math.random() * Math.PI / 180),
          z: this.diff * Math.sin(360 * Math.random() * Math.PI / 180)
        }
      }));
      this.calc.push({
        x: 360 * Math.random(),
        y: 360 * Math.random(),
        z: 360 * Math.random()
      });
    };

    Build.prototype.addMany = function(count) {
      for (let i = 0; i < count; i++) {
        this.add();
      }
    };

    Build.prototype.upd = function() {
      cam.obj.x += (this.toX - cam.obj.x) * 0.05;
      cam.obj.y += (this.toY - cam.obj.y) * 0.05;
    };

    Build.prototype.draw = function() {
      this.$.clearRect(0, 0, this.canvas.width, this.canvas.height);
      cam.upd();
      this.rotObj.x += 0.1;
      this.rotObj.y += 0.1;
      this.rotObj.z += 0.1;

      for (let i = 0; i < this.varr.length; i++) {
        for (const val in this.calc[i]) {
          if (Object.prototype.hasOwnProperty.call(this.calc[i], val)) {
            this.calc[i][val] += this.vel;
            if (this.calc[i][val] > this.lim) {
              this.calc[i][val] = 0;
            }
          }
        }

        this.varr[i].transIn.pos = {
          x: this.diff * Math.cos(this.calc[i].x * Math.PI / 180),
          y: this.diff * Math.sin(this.calc[i].y * Math.PI / 180),
          z: this.diff * Math.sin(this.calc[i].z * Math.PI / 180)
        };
        this.varr[i].transIn.rot = this.rotObj;
        this.varr[i].transIn.sz = this.objSz;
        this.varr[i].vupd();

        if (this.varr[i].transOut.p < 0) {
          continue;
        }

        const out = this.varr[i].transOut;
        const g = this.$.createRadialGradient(out.x, out.y, out.p, out.x, out.y, out.p * 2);
        this.$.globalCompositeOperation = 'lighter';
        g.addColorStop(0, 'hsla(255, 255%, 255%, 1)');
        g.addColorStop(0.5, 'hsla(' + (i + 2) + ',85%,40%,1)');
        g.addColorStop(1, 'hsla(' + i + ',85%,40%,.5)');
        this.$.fillStyle = g;
        this.$.beginPath();
        this.$.arc(out.x, out.y, out.p * 2, 0, Math.PI * 2, false);
        this.$.fill();
        this.$.closePath();
      }
      this.$.globalCompositeOperation = 'source-over';
    };

    Build.prototype.anim = function() {
      const anim = function() {
        this.upd();
        this.draw();
        if (!reduceMotion) {
          this.rafId = window.requestAnimationFrame(anim);
        }
      }.bind(this);
      anim();
    };

    Build.prototype.resize = function() {
      w = window.innerWidth;
      h = window.innerHeight;
      this.canvas.width = w;
      this.canvas.height = h;
      this.objSz = {
        x: w / 5,
        y: h / 5,
        z: w / 5
      };
      cam.disp.x = w / 2;
      cam.disp.y = h / 2;
    };

    Build.prototype.run = function() {
      this.anim();

      window.addEventListener('mousemove', function(e) {
        this.toX = (e.clientX - this.canvas.width / 2) * -0.8;
        this.toY = (e.clientY - this.canvas.height / 2) * 0.8;
      }.bind(this));

      window.addEventListener('touchmove', function(e) {
        if (!e.touches.length) {
          return;
        }
        this.toX = (e.touches[0].clientX - this.canvas.width / 2) * -0.8;
        this.toY = (e.touches[0].clientY - this.canvas.height / 2) * 0.8;
      }.bind(this), { passive: true });

      window.addEventListener('mousedown', function(e) {
        if (toggle.contains(e.target)) {
          return;
        }
        this.addMany(100);
      }.bind(this));

      window.addEventListener('touchstart', function(e) {
        if (toggle.contains(e.target)) {
          return;
        }
        this.addMany(100);
      }.bind(this), { passive: true });
    };



    const CanvasNest = function() {
      this.canvas = nestCanvas;
      this.ctx = nestCtx;
      this.points = [];
      this.mouse = {
        x: null,
        y: null,
        max: 20000
      };
      this.count = 115;
      this.maxDistance = 8500;
      this.color = '0,0,0';
      this.opacity = 0.42;
      this.rafId = null;
      this.init();
    };

    CanvasNest.prototype.init = function() {
      this.resize();
      this.points = [];

      for (let i = 0; i < this.count; i++) {
        this.points.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          xa: Math.random() * 2 - 1,
          ya: Math.random() * 2 - 1,
          max: this.maxDistance
        });
      }
    };

    CanvasNest.prototype.resize = function() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    };

    CanvasNest.prototype.draw = function() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      if (getTheme() !== 'day') {
        return;
      }

      const allPoints = this.mouse.x === null ? this.points : this.points.concat([this.mouse]);

      for (let i = 0; i < this.points.length; i++) {
        const point = this.points[i];
        point.x += point.xa;
        point.y += point.ya;
        point.xa *= point.x > this.width || point.x < 0 ? -1 : 1;
        point.ya *= point.y > this.height || point.y < 0 ? -1 : 1;

        this.ctx.fillStyle = 'rgba(' + this.color + ',0.58)';
        this.ctx.fillRect(point.x - 0.7, point.y - 0.7, 1.4, 1.4);

        for (let j = i + 1; j < allPoints.length; j++) {
          const target = allPoints[j];
          if (target.x === null || target.y === null) {
            continue;
          }

          const xDistance = point.x - target.x;
          const yDistance = point.y - target.y;
          const distance = xDistance * xDistance + yDistance * yDistance;
          const maxDistance = target.max || this.maxDistance;

          if (distance < maxDistance) {
            if (target === this.mouse && distance > maxDistance / 2) {
              point.x -= xDistance * 0.03;
              point.y -= yDistance * 0.03;
            }

            const ratio = (maxDistance - distance) / maxDistance;
            this.ctx.beginPath();
            this.ctx.lineWidth = Math.max(0.28, ratio * 0.76);
            this.ctx.strokeStyle = 'rgba(' + this.color + ',' + Math.min(0.46, (ratio + 0.18) * this.opacity) + ')';
            this.ctx.moveTo(point.x, point.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
          }
        }
      }
    };

    CanvasNest.prototype.run = function() {
      const tick = function() {
        this.draw();
        if (!reduceMotion) {
          this.rafId = window.requestAnimationFrame(tick);
        }
      }.bind(this);

      tick();

      window.addEventListener('mousemove', function(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
      }.bind(this));

      window.addEventListener('mouseout', function() {
        this.mouse.x = null;
        this.mouse.y = null;
      }.bind(this));
    };

    function getSavedTheme() {
      try {
        return window.localStorage.getItem(storageKey);
      } catch (error) {
        return null;
      }
    }

    function saveTheme(theme) {
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (error) {
        return;
      }
    }

    function getTheme() {
      return document.body.classList.contains('theme-night') ? 'night' : 'day';
    }

    function updateToggle() {
      const isNight = getTheme() === 'night';
      toggle.setAttribute('aria-label', isNight ? 'Switch to day theme' : 'Switch to nebula night theme');
      toggle.setAttribute('title', isNight ? 'Switch to day theme' : 'Switch to nebula night theme');
      toggle.innerHTML = [
        '<span class="theme-toggle-icon" aria-hidden="true">',
        isNight ? 'DAY' : 'NIGHT',
        '</span>',
        '<span class="theme-toggle-label">',
        isNight ? 'Day' : 'Nebula',
        '</span>'
      ].join('');
    }

    function applyTheme(theme) {
      document.body.classList.toggle('theme-night', theme === 'night');
      document.body.classList.toggle('theme-day', theme !== 'night');
      updateToggle();
      saveTheme(theme);
    }

    function placeToggleInMenu() {
      const homeLink = document.querySelector('.menu-items .menu-index');
      if (!homeLink || !homeLink.parentNode) {
        return false;
      }
      homeLink.parentNode.insertBefore(toggle, homeLink);
      return true;
    }

    canvas.id = 'canv';
    canvas.className = 'nebula-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    nestCanvas.className = 'canvas-nest-canvas';
    nestCanvas.setAttribute('aria-hidden', 'true');
    toggle.className = 'theme-toggle';
    toggle.type = 'button';

    document.body.insertBefore(nestCanvas, document.body.firstChild);
    document.body.insertBefore(canvas, nestCanvas.nextSibling);
    document.body.appendChild(toggle);

    applyTheme(getSavedTheme() || 'night');

    app = new Build();
    app.run();
    nestApp = new CanvasNest();
    nestApp.run();

    toggle.addEventListener('click', function() {
      applyTheme(getTheme() === 'night' ? 'day' : 'night');
    });

    document.addEventListener('menuLoaded', placeToggleInMenu);
    if (!placeToggleInMenu()) {
      window.setTimeout(placeToggleInMenu, 100);
    }

    window.addEventListener('resize', function() {
      if (app) {
        app.resize();
      }
      if (nestApp) {
        nestApp.resize();
      }
    }, false);

    window.addEventListener('beforeunload', function() {
      if (app && app.rafId) {
        window.cancelAnimationFrame(app.rafId);
      }
      if (nestApp && nestApp.rafId) {
        window.cancelAnimationFrame(nestApp.rafId);
      }
    });
  });
})();
