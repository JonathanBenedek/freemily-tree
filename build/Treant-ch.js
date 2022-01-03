;
(function () {
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            return this.substr(position || 0, searchString.length) === searchString;
        };
    }
    var $ = null;
    var UTIL = {
        inheritAttrs: function (applyTo, applyFrom) {
            for (var attr in applyFrom) {
                if (applyFrom.hasOwnProperty(attr)) {
                    if ((applyTo[attr] instanceof Object && applyFrom[attr] instanceof Object) && (typeof applyFrom[attr] !== 'function')) {
                        this.inheritAttrs(applyTo[attr], applyFrom[attr]);
                    }
                    else {
                        applyTo[attr] = applyFrom[attr];
                    }
                }
            }
            return applyTo;
        },
        createMerge: function (obj1, obj2) {
            var newObj = {};
            if (obj1) {
                this.inheritAttrs(newObj, this.cloneObj(obj1));
            }
            if (obj2) {
                this.inheritAttrs(newObj, obj2);
            }
            return newObj;
        },
        extend: function () {
            if ($) {
                Array.prototype.unshift.apply(arguments, [true, {}]);
                return $.extend.apply($, arguments);
            }
            else {
                return UTIL.createMerge.apply(this, arguments);
            }
        },
        cloneObj: function (obj) {
            if (Object(obj) !== obj) {
                return obj;
            }
            var res = new obj.constructor();
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    res[key] = this.cloneObj(obj[key]);
                }
            }
            return res;
        },
        addEvent: function (el, eventType, handler) {
            if ($) {
                $(el).on(eventType + '.treant', handler);
            }
            else if (el.addEventListener) {
                el.addEventListener(eventType, handler, false);
            }
            else if (el.attachEvent) {
                el.attachEvent('on' + eventType, handler);
            }
            else {
                el['on' + eventType] = handler;
            }
        },
        findEl: function (selector, raw, parentEl) {
            parentEl = parentEl || document;
            if ($) {
                var $element = $(selector, parentEl);
                return (raw ? $element.get(0) : $element);
            }
            else {
                if (selector.charAt(0) === '#') {
                    return parentEl.getElementById(selector.substring(1));
                }
                else if (selector.charAt(0) === '.') {
                    var oElements = parentEl.getElementsByClassName(selector.substring(1));
                    return (oElements.length ? oElements[0] : null);
                }
                throw new Error('Unknown container element');
            }
        },
        getOuterHeight: function (element) {
            var nRoundingCompensation = 1;
            if (typeof element.getBoundingClientRect === 'function') {
                return element.getBoundingClientRect().height;
            }
            else if ($) {
                return Math.ceil($(element).outerHeight()) + nRoundingCompensation;
            }
            else {
                return Math.ceil(element.clientHeight +
                    UTIL.getStyle(element, 'border-top-width', true) +
                    UTIL.getStyle(element, 'border-bottom-width', true) +
                    UTIL.getStyle(element, 'padding-top', true) +
                    UTIL.getStyle(element, 'padding-bottom', true) +
                    nRoundingCompensation);
            }
        },
        getOuterWidth: function (element) {
            var nRoundingCompensation = 1;
            if (typeof element.getBoundingClientRect === 'function') {
                return element.getBoundingClientRect().width;
            }
            else if ($) {
                return Math.ceil($(element).outerWidth()) + nRoundingCompensation;
            }
            else {
                return Math.ceil(element.clientWidth +
                    UTIL.getStyle(element, 'border-left-width', true) +
                    UTIL.getStyle(element, 'border-right-width', true) +
                    UTIL.getStyle(element, 'padding-left', true) +
                    UTIL.getStyle(element, 'padding-right', true) +
                    nRoundingCompensation);
            }
        },
        getStyle: function (element, strCssRule, asInt) {
            var strValue = "";
            if (document.defaultView && document.defaultView.getComputedStyle) {
                strValue = document.defaultView.getComputedStyle(element, '').getPropertyValue(strCssRule);
            }
            else if (element.currentStyle) {
                strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
                    return p1.toUpperCase();
                });
                strValue = element.currentStyle[strCssRule];
            }
            return (asInt ? parseFloat(strValue) : strValue);
        },
        addClass: function (element, cssClass) {
            if ($) {
                $(element).addClass(cssClass);
            }
            else {
                if (!UTIL.hasClass(element, cssClass)) {
                    if (element.classList) {
                        element.classList.add(cssClass);
                    }
                    else {
                        element.className += " " + cssClass;
                    }
                }
            }
        },
        hasClass: function (element, my_class) {
            return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(" " + my_class + " ") > -1;
        },
        toggleClass: function (element, cls, apply) {
            if ($) {
                $(element).toggleClass(cls, apply);
            }
            else {
                if (apply) {
                    element.classList.add(cls);
                }
                else {
                    element.classList.remove(cls);
                }
            }
        },
        setDimensions: function (element, width, height) {
            if ($) {
                $(element).width(width).height(height);
            }
            else {
                element.style.width = width + 'px';
                element.style.height = height + 'px';
            }
        },
        isjQueryAvailable: function () { return (typeof ($) !== 'undefined' && $); }
    };
    var ImageLoader = function () {
        this.reset();
    };
    ImageLoader.prototype = {
        reset: function () {
            this.loading = [];
            return this;
        },
        processNode: function (node) {
            var aImages = node.nodeDOM.getElementsByTagName('img');
            var i = aImages.length;
            while (i--) {
                this.create(node, aImages[i]);
            }
            return this;
        },
        removeAll: function (img_src) {
            var i = this.loading.length;
            while (i--) {
                if (this.loading[i] === img_src) {
                    this.loading.splice(i, 1);
                }
            }
            return this;
        },
        create: function (node, image) {
            var self = this, source = image.src;
            function imgTrigger() {
                self.removeAll(source);
                node.width = node.nodeDOM.offsetWidth;
                node.height = node.nodeDOM.offsetHeight;
            }
            if (image.src.indexOf('data:') !== 0) {
                this.loading.push(source);
                if (image.complete) {
                    return imgTrigger();
                }
                UTIL.addEvent(image, 'load', imgTrigger);
                UTIL.addEvent(image, 'error', imgTrigger);
                image.src += ((image.src.indexOf('?') > 0) ? '&' : '?') + new Date().getTime();
            }
            else {
                imgTrigger();
            }
        },
        isNotLoading: function () {
            return (this.loading.length === 0);
        }
    };
    var TreeStore = {
        store: [],
        createTree: function (jsonConfig) {
            var nNewTreeId = this.store.length;
            this.store.push(new Tree(jsonConfig, nNewTreeId));
            return this.get(nNewTreeId);
        },
        get: function (treeId) {
            return this.store[treeId];
        },
        destroy: function (treeId) {
            var tree = this.get(treeId);
            if (tree) {
                tree._R.remove();
                var draw_area = tree.drawArea;
                while (draw_area.firstChild) {
                    draw_area.removeChild(draw_area.firstChild);
                }
                var classes = draw_area.className.split(' '), classes_to_stay = [];
                for (var i = 0; i < classes.length; i++) {
                    var cls = classes[i];
                    if (cls !== 'Treant' && cls !== 'Treant-loaded') {
                        classes_to_stay.push(cls);
                    }
                }
                draw_area.style.overflowY = '';
                draw_area.style.overflowX = '';
                draw_area.className = classes_to_stay.join(' ');
                this.store[treeId] = null;
            }
            return this;
        }
    };
    var Tree = function (jsonConfig, treeId) {
        this.reset = function (jsonConfig, treeId) {
            this.initJsonConfig = jsonConfig;
            this.initTreeId = treeId;
            this.id = treeId;
            this.CONFIG = UTIL.extend(Tree.CONFIG, jsonConfig.chart);
            this.drawArea = UTIL.findEl(this.CONFIG.container, true);
            if (!this.drawArea) {
                throw new Error('Failed to find element by selector "' + this.CONFIG.container + '"');
            }
            UTIL.addClass(this.drawArea, 'Treant');
            this.drawArea.innerHTML = '';
            this.imageLoader = new ImageLoader();
            this.nodeDB = new NodeDB(jsonConfig.nodeStructure, this);
            this.connectionStore = {};
            this.loaded = false;
            this._R = new Raphael(this.drawArea, 100, 100);
            return this;
        };
        this.reload = function () {
            this.reset(this.initJsonConfig, this.initTreeId).redraw();
            return this;
        };
        this.reset(jsonConfig, treeId);
    };
    Tree.prototype = {
        getNodeDb: function () {
            return this.nodeDB;
        },
        addNode: function (parentTreeNode, nodeDefinition) {
            var dbEntry = this.nodeDB.get(parentTreeNode.id);
            this.CONFIG.callback.onBeforeAddNode.apply(this, [parentTreeNode, nodeDefinition]);
            var oNewNode = this.nodeDB.createNode(nodeDefinition, parentTreeNode.id, this);
            oNewNode.createGeometry(this);
            oNewNode.parent().createSwitchGeometry(this);
            this.positionTree();
            this.CONFIG.callback.onAfterAddNode.apply(this, [oNewNode, parentTreeNode, nodeDefinition]);
            return oNewNode;
        },
        redraw: function () {
            this.positionTree();
            return this;
        },
        positionTree: function (callback) {
            var self = this;
            if (this.imageLoader.isNotLoading()) {
                var root = this.root(), orient = this.CONFIG.rootOrientation;
                this.resetLevelData();
                this.firstWalk(root, 0);
                this.secondWalk(root, 0, 0, 0);
                this.positionNodes();
                if (this.CONFIG.animateOnInit) {
                    setTimeout(function () {
                        root.toggleCollapse();
                    }, this.CONFIG.animateOnInitDelay);
                }
                if (!this.loaded) {
                    UTIL.addClass(this.drawArea, 'Treant-loaded');
                    if (Object.prototype.toString.call(callback) === "[object Function]") {
                        callback(self);
                    }
                    self.CONFIG.callback.onTreeLoaded.apply(self, [root]);
                    this.loaded = true;
                }
            }
            else {
                setTimeout(function () {
                    self.positionTree(callback);
                }, 10);
            }
            return this;
        },
        firstWalk: function (node, level) {
            node.prelim = null;
            node.modifier = null;
            this.setNeighbors(node, level);
            this.calcLevelDim(node, level);
            var leftSibling = node.leftSibling();
            if (node.childrenCount() === 0 || level == this.CONFIG.maxDepth) {
                if (leftSibling) {
                    node.prelim = leftSibling.prelim + leftSibling.size() + this.CONFIG.siblingSeparation;
                }
                else {
                    node.prelim = 0;
                }
            }
            else {
                for (var i = 0, n = node.childrenCount(); i < n; i++) {
                    this.firstWalk(node.childAt(i), level + 1);
                }
                var midPoint = node.childrenCenter() - node.size() / 2;
                if (leftSibling) {
                    node.prelim = leftSibling.prelim + leftSibling.size() + this.CONFIG.siblingSeparation;
                    node.modifier = node.prelim - midPoint;
                    this.apportion(node, level);
                }
                else {
                    node.prelim = midPoint;
                }
                if (node.stackParent) {
                    node.modifier += this.nodeDB.get(node.stackChildren[0]).size() / 2 + node.connStyle.stackIndent;
                }
                else if (node.stackParentId) {
                    node.prelim = 0;
                }
            }
            return this;
        },
        apportion: function (node, level) {
            var firstChild = node.firstChild(), firstChildLeftNeighbor = firstChild.leftNeighbor(), compareDepth = 1, depthToStop = this.CONFIG.maxDepth - level;
            while (firstChild && firstChildLeftNeighbor && compareDepth <= depthToStop) {
                var modifierSumRight = 0, modifierSumLeft = 0, leftAncestor = firstChildLeftNeighbor, rightAncestor = firstChild;
                for (var i = 0; i < compareDepth; i++) {
                    leftAncestor = leftAncestor.parent();
                    rightAncestor = rightAncestor.parent();
                    modifierSumLeft += leftAncestor.modifier;
                    modifierSumRight += rightAncestor.modifier;
                    if (rightAncestor.stackParent !== undefined) {
                        modifierSumRight += rightAncestor.size() / 2;
                    }
                }
                var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + firstChildLeftNeighbor.size() + this.CONFIG.subTeeSeparation) - (firstChild.prelim + modifierSumRight);
                if (totalGap > 0) {
                    var subtreeAux = node, numSubtrees = 0;
                    while (subtreeAux && subtreeAux.id !== leftAncestor.id) {
                        subtreeAux = subtreeAux.leftSibling();
                        numSubtrees++;
                    }
                    if (subtreeAux) {
                        var subtreeMoveAux = node, singleGap = totalGap / numSubtrees;
                        while (subtreeMoveAux.id !== leftAncestor.id) {
                            subtreeMoveAux.prelim += totalGap;
                            subtreeMoveAux.modifier += totalGap;
                            totalGap -= singleGap;
                            subtreeMoveAux = subtreeMoveAux.leftSibling();
                        }
                    }
                }
                compareDepth++;
                firstChild = (firstChild.childrenCount() === 0) ?
                    node.leftMost(0, compareDepth) :
                    firstChild = firstChild.firstChild();
                if (firstChild) {
                    firstChildLeftNeighbor = firstChild.leftNeighbor();
                }
            }
        },
        secondWalk: function (node, level, X, Y) {
            if (level <= this.CONFIG.maxDepth) {
                var xTmp = node.prelim + X, yTmp = Y, align = this.CONFIG.nodeAlign, orient = this.CONFIG.rootOrientation, levelHeight, nodesizeTmp;
                if (orient === 'NORTH' || orient === 'SOUTH') {
                    levelHeight = this.levelMaxDim[level].height;
                    nodesizeTmp = node.height;
                    if (node.pseudo) {
                        node.height = levelHeight;
                    }
                }
                else if (orient === 'WEST' || orient === 'EAST') {
                    levelHeight = this.levelMaxDim[level].width;
                    nodesizeTmp = node.width;
                    if (node.pseudo) {
                        node.width = levelHeight;
                    }
                }
                node.X = xTmp;
                if (node.pseudo) {
                    if (orient === 'NORTH' || orient === 'WEST') {
                        node.Y = yTmp;
                    }
                    else if (orient === 'SOUTH' || orient === 'EAST') {
                        node.Y = (yTmp + (levelHeight - nodesizeTmp));
                    }
                }
                else {
                    node.Y = (align === 'CENTER') ? (yTmp + (levelHeight - nodesizeTmp) / 2) :
                        (align === 'TOP') ? (yTmp + (levelHeight - nodesizeTmp)) :
                            yTmp;
                }
                if (orient === 'WEST' || orient === 'EAST') {
                    var swapTmp = node.X;
                    node.X = node.Y;
                    node.Y = swapTmp;
                }
                if (orient === 'SOUTH') {
                    node.Y = -node.Y - nodesizeTmp;
                }
                else if (orient === 'EAST') {
                    node.X = -node.X - nodesizeTmp;
                }
                if (node.childrenCount() !== 0) {
                    if (node.id === 0 && this.CONFIG.hideRootNode) {
                        this.secondWalk(node.firstChild(), level + 1, X + node.modifier, Y);
                    }
                    else {
                        this.secondWalk(node.firstChild(), level + 1, X + node.modifier, Y + levelHeight + this.CONFIG.levelSeparation);
                    }
                }
                if (node.rightSibling()) {
                    this.secondWalk(node.rightSibling(), level, X, Y);
                }
            }
        },
        positionNodes: function () {
            var self = this, treeSize = {
                x: self.nodeDB.getMinMaxCoord('X', null, null),
                y: self.nodeDB.getMinMaxCoord('Y', null, null)
            }, treeWidth = treeSize.x.max - treeSize.x.min, treeHeight = treeSize.y.max - treeSize.y.min, treeCenter = {
                x: treeSize.x.max - treeWidth / 2,
                y: treeSize.y.max - treeHeight / 2
            };
            this.handleOverflow(treeWidth, treeHeight);
            var containerCenter = {
                x: self.drawArea.clientWidth / 2,
                y: self.drawArea.clientHeight / 2
            }, deltaX = containerCenter.x - treeCenter.x, deltaY = containerCenter.y - treeCenter.y, negOffsetX = ((treeSize.x.min + deltaX) <= 0) ? Math.abs(treeSize.x.min) : 0, negOffsetY = ((treeSize.y.min + deltaY) <= 0) ? Math.abs(treeSize.y.min) : 0, i, len, node;
            for (i = 0, len = this.nodeDB.db.length; i < len; i++) {
                node = this.nodeDB.get(i);
                self.CONFIG.callback.onBeforePositionNode.apply(self, [node, i, containerCenter, treeCenter]);
                if (node.id === 0 && this.CONFIG.hideRootNode) {
                    self.CONFIG.callback.onAfterPositionNode.apply(self, [node, i, containerCenter, treeCenter]);
                    continue;
                }
                node.X += negOffsetX + ((treeWidth < this.drawArea.clientWidth) ? deltaX : this.CONFIG.padding);
                node.Y += negOffsetY + ((treeHeight < this.drawArea.clientHeight) ? deltaY : this.CONFIG.padding);
                var collapsedParent = node.collapsedParent(), hidePoint = null;
                if (collapsedParent) {
                    hidePoint = collapsedParent.connectorPoint(true);
                    node.hide(hidePoint);
                }
                else if (node.positioned) {
                    node.show();
                }
                else {
                    node.nodeDOM.style.left = node.X + 'px';
                    node.nodeDOM.style.top = node.Y + 'px';
                    node.positioned = true;
                }
                if (0 !== node.id) {
                    if (node.spouse) {
                        node.X -= 40;
                    }
                }
                if (node.id !== 0 && !(node.parent().id === 0 && this.CONFIG.hideRootNode)) {
                    this.setConnectionToParent(node, hidePoint);
                }
                else if (!this.CONFIG.hideRootNode && node.drawLineThrough) {
                    node.drawLineThroughMe();
                }
                self.CONFIG.callback.onAfterPositionNode.apply(self, [node, i, containerCenter, treeCenter]);
                if (0 !== node.id) {
                    if (node.spouse) {
                        node.X += 40;
                    }
                }
            }
            return this;
        },
        handleOverflow: function (treeWidth, treeHeight) {
            var viewWidth = (treeWidth < this.drawArea.clientWidth) ? this.drawArea.clientWidth : treeWidth + this.CONFIG.padding * 2, viewHeight = (treeHeight < this.drawArea.clientHeight) ? this.drawArea.clientHeight : treeHeight + this.CONFIG.padding * 2;
            this._R.setSize(viewWidth, viewHeight);
            if (this.CONFIG.scrollbar === 'resize') {
                UTIL.setDimensions(this.drawArea, viewWidth, viewHeight);
            }
            else if (!UTIL.isjQueryAvailable() || this.CONFIG.scrollbar === 'native') {
                if (this.drawArea.clientWidth < treeWidth) {
                }
                if (this.drawArea.clientHeight < treeHeight) {
                }
            }
            else if (this.CONFIG.scrollbar === 'fancy') {
                var jq_drawArea = $(this.drawArea);
                if (jq_drawArea.hasClass('ps-container')) {
                    jq_drawArea.find('.Treant').css({
                        width: viewWidth,
                        height: viewHeight
                    });
                    jq_drawArea.perfectScrollbar('update');
                }
                else {
                    var mainContainer = jq_drawArea.wrapInner('<div class="Treant"/>'), child = mainContainer.find('.Treant');
                    child.css({
                        width: viewWidth,
                        height: viewHeight
                    });
                    mainContainer.perfectScrollbar();
                }
            }
            return this;
        },
        setConnectionToParent: function (treeNode, hidePoint) {
            var stacked = treeNode.stackParentId, connLine, parent = (stacked ? this.nodeDB.get(stacked) : treeNode.parent()), pathString = hidePoint ?
                this.getPointPathString(hidePoint) :
                this.getPathString(parent, treeNode, stacked);
            if (this.connectionStore[treeNode.id]) {
                connLine = this.connectionStore[treeNode.id];
                this.animatePath(connLine, pathString);
            }
            else {
                connLine = this._R.path(pathString);
                this.connectionStore[treeNode.id] = connLine;
                if (treeNode.pseudo) {
                    delete parent.connStyle.style['arrow-end'];
                }
                if (parent.pseudo) {
                    delete parent.connStyle.style['arrow-start'];
                }
                connLine.attr(parent.connStyle.style);
                if (treeNode.drawLineThrough || treeNode.pseudo) {
                    treeNode.drawLineThroughMe(hidePoint);
                }
            }
            treeNode.connector = connLine;
            return this;
        },
        getPointPathString: function (hidePoint) {
            return ["_M", hidePoint.x, ",", hidePoint.y, 'L', hidePoint.x, ",", hidePoint.y, hidePoint.x, ",", hidePoint.y].join(' ');
        },
        animatePath: function (path, pathString) {
            if (path.hidden && pathString.charAt(0) !== "_") {
                path.show();
                path.hidden = false;
            }
            path.animate({
                path: pathString.charAt(0) === "_" ?
                    pathString.substring(1) : pathString
            }, this.CONFIG.animation.connectorsSpeed, this.CONFIG.animation.connectorsAnimation, function () {
                if (pathString.charAt(0) === "_") {
                    path.hide();
                    path.hidden = true;
                }
            });
            return this;
        },
        getPathString: function (from_node, to_node, stacked) {
            var startPoint = from_node.connectorPoint(true), endPoint = to_node.connectorPoint(false), orientation = this.CONFIG.rootOrientation, connType = from_node.connStyle.type, P1 = {}, P2 = {};
            if (orientation === 'NORTH' || orientation === 'SOUTH') {
                P1.y = P2.y = (startPoint.y + endPoint.y) / 2;
                P1.x = startPoint.x;
                P2.x = endPoint.x;
            }
            else if (orientation === 'EAST' || orientation === 'WEST') {
                P1.x = P2.x = (startPoint.x + endPoint.x) / 2;
                P1.y = startPoint.y;
                P2.y = endPoint.y;
            }
            var sp = startPoint.x + ',' + startPoint.y, p1 = P1.x + ',' + P1.y, p2 = P2.x + ',' + P2.y, ep = endPoint.x + ',' + endPoint.y, pm = (P1.x + P2.x) / 2 + ',' + (P1.y + P2.y) / 2, pathString, stackPoint;
            if (stacked) {
                stackPoint = (orientation === 'EAST' || orientation === 'WEST') ?
                    endPoint.x + ',' + startPoint.y :
                    startPoint.x + ',' + endPoint.y;
                if (connType === "step" || connType === "straight") {
                    pathString = ["M", sp, 'L', stackPoint, 'L', ep];
                }
                else if (connType === "curve" || connType === "bCurve") {
                    var helpPoint, indent = from_node.connStyle.stackIndent;
                    if (orientation === 'NORTH') {
                        helpPoint = (endPoint.x - indent) + ',' + (endPoint.y - indent);
                    }
                    else if (orientation === 'SOUTH') {
                        helpPoint = (endPoint.x - indent) + ',' + (endPoint.y + indent);
                    }
                    else if (orientation === 'EAST') {
                        helpPoint = (endPoint.x + indent) + ',' + startPoint.y;
                    }
                    else if (orientation === 'WEST') {
                        helpPoint = (endPoint.x - indent) + ',' + startPoint.y;
                    }
                    pathString = ["M", sp, 'L', helpPoint, 'S', stackPoint, ep];
                }
            }
            else {
                if (connType === "step") {
                    pathString = ["M", sp, 'L', p1, 'L', p2, 'L', ep];
                }
                else if (connType === "curve") {
                    pathString = ["M", sp, 'C', p1, p2, ep];
                }
                else if (connType === "bCurve") {
                    pathString = ["M", sp, 'Q', p1, pm, 'T', ep];
                }
                else if (connType === "straight") {
                    pathString = ["M", sp, 'L', sp, ep];
                }
            }
            return pathString.join(" ");
        },
        setNeighbors: function (node, level) {
            node.leftNeighborId = this.lastNodeOnLevel[level];
            if (node.leftNeighborId) {
                node.leftNeighbor().rightNeighborId = node.id;
            }
            this.lastNodeOnLevel[level] = node.id;
            return this;
        },
        calcLevelDim: function (node, level) {
            this.levelMaxDim[level] = {
                width: Math.max(this.levelMaxDim[level] ? this.levelMaxDim[level].width : 0, node.width),
                height: Math.max(this.levelMaxDim[level] ? this.levelMaxDim[level].height : 0, node.height)
            };
            return this;
        },
        resetLevelData: function () {
            this.lastNodeOnLevel = [];
            this.levelMaxDim = [];
            return this;
        },
        root: function () {
            return this.nodeDB.get(0);
        }
    };
    var NodeDB = function (nodeStructure, tree) {
        this.reset(nodeStructure, tree);
    };
    NodeDB.prototype = {
        reset: function (nodeStructure, tree) {
            this.db = [];
            var self = this;
            function iterateChildren(node, parentId) {
                var newNode = self.createNode(node, parentId, tree, null);
                if (node.children) {
                    if (node.childrenDropLevel && node.childrenDropLevel > 0) {
                        while (node.childrenDropLevel--) {
                            var connStyle = UTIL.cloneObj(newNode.connStyle);
                            newNode = self.createNode('pseudo', newNode.id, tree, null);
                            newNode.connStyle = connStyle;
                            newNode.children = [];
                        }
                    }
                    var stack = (node.stackChildren && !self.hasGrandChildren(node)) ? newNode.id : null;
                    if (stack !== null) {
                        newNode.stackChildren = [];
                    }
                    for (var i = 0, len = node.children.length; i < len; i++) {
                        if (stack !== null) {
                            newNode = self.createNode(node.children[i], newNode.id, tree, stack);
                            if ((i + 1) < len) {
                                newNode.children = [];
                            }
                        }
                        else {
                            iterateChildren(node.children[i], newNode.id);
                        }
                    }
                }
            }
            if (tree.CONFIG.animateOnInit) {
                nodeStructure.collapsed = true;
            }
            iterateChildren(nodeStructure, -1);
            this.createGeometries(tree);
            return this;
        },
        createGeometries: function (tree) {
            var i = this.db.length;
            while (i--) {
                this.get(i).createGeometry(tree);
            }
            return this;
        },
        get: function (nodeId) {
            return this.db[nodeId];
        },
        walk: function (callback) {
            var i = this.db.length;
            while (i--) {
                callback.apply(this, [this.get(i)]);
            }
            return this;
        },
        createNode: function (nodeStructure, parentId, tree, stackParentId) {
            var node = new TreeNode(nodeStructure, this.db.length, parentId, tree, stackParentId);
            this.db.push(node);
            if (parentId >= 0) {
                var parent = this.get(parentId);
                if (nodeStructure.position) {
                    if (nodeStructure.position === 'left') {
                        parent.children.push(node.id);
                    }
                    else if (nodeStructure.position === 'right') {
                        parent.children.splice(0, 0, node.id);
                    }
                    else if (nodeStructure.position === 'center') {
                        parent.children.splice(Math.floor(parent.children.length / 2), 0, node.id);
                    }
                    else {
                        var position = parseInt(nodeStructure.position);
                        if (parent.children.length === 1 && position > 0) {
                            parent.children.splice(0, 0, node.id);
                        }
                        else {
                            parent.children.splice(Math.max(position, parent.children.length - 1), 0, node.id);
                        }
                    }
                }
                else {
                    parent.children.push(node.id);
                }
            }
            if (stackParentId) {
                this.get(stackParentId).stackParent = true;
                this.get(stackParentId).stackChildren.push(node.id);
            }
            return node;
        },
        getMinMaxCoord: function (dim, parent, MinMax) {
            parent = parent || this.get(0);
            MinMax = MinMax || {
                min: parent[dim],
                max: parent[dim] + ((dim === 'X') ? parent.width : parent.height)
            };
            var i = parent.childrenCount();
            while (i--) {
                var node = parent.childAt(i), maxTest = node[dim] + ((dim === 'X') ? node.width : node.height), minTest = node[dim];
                if (maxTest > MinMax.max) {
                    MinMax.max = maxTest;
                }
                if (minTest < MinMax.min) {
                    MinMax.min = minTest;
                }
                this.getMinMaxCoord(dim, node, MinMax);
            }
            return MinMax;
        },
        hasGrandChildren: function (nodeStructure) {
            var i = nodeStructure.children.length;
            while (i--) {
                if (nodeStructure.children[i].children) {
                    return true;
                }
            }
            return false;
        }
    };
    var TreeNode = function (nodeStructure, id, parentId, tree, stackParentId) {
        this.reset(nodeStructure, id, parentId, tree, stackParentId);
    };
    TreeNode.prototype = {
        reset: function (nodeStructure, id, parentId, tree, stackParentId) {
            this.id = id;
            this.parentId = parentId;
            this.treeId = tree.id;
            this.prelim = 0;
            this.modifier = 0;
            this.leftNeighborId = null;
            this.stackParentId = stackParentId;
            this.pseudo = nodeStructure === 'pseudo' || nodeStructure['pseudo'];
            this.meta = nodeStructure.meta || {};
            this.image = nodeStructure.image || null;
            this.link = UTIL.createMerge(tree.CONFIG.node.link, nodeStructure.link);
            this.connStyle = UTIL.createMerge(tree.CONFIG.connectors, nodeStructure.connectors);
            this.connector = null;
            this.drawLineThrough = nodeStructure.drawLineThrough === false ? false : (nodeStructure.drawLineThrough || tree.CONFIG.node.drawLineThrough);
            this.collapsable = nodeStructure.collapsable === false ? false : (nodeStructure.collapsable || tree.CONFIG.node.collapsable);
            this.collapsed = nodeStructure.collapsed;
            this.text = nodeStructure.text;
            this.spouse = nodeStructure.spouse;
            this.button = nodeStructure.button;
            this.nodeInnerHTML = nodeStructure.innerHTML;
            this.nodeHTMLclass = (tree.CONFIG.node.HTMLclass ? tree.CONFIG.node.HTMLclass : '') +
                (nodeStructure.HTMLclass ? (' ' + nodeStructure.HTMLclass) : '');
            this.nodeHTMLid = nodeStructure.HTMLid;
            this.children = [];
            return this;
        },
        getTree: function () {
            return TreeStore.get(this.treeId);
        },
        getTreeConfig: function () {
            return this.getTree().CONFIG;
        },
        getTreeNodeDb: function () {
            return this.getTree().getNodeDb();
        },
        lookupNode: function (nodeId) {
            return this.getTreeNodeDb().get(nodeId);
        },
        Tree: function () {
            return TreeStore.get(this.treeId);
        },
        dbGet: function (nodeId) {
            return this.getTreeNodeDb().get(nodeId);
        },
        size: function () {
            var orientation = this.getTreeConfig().rootOrientation;
            if (this.pseudo) {
                return (-this.getTreeConfig().subTeeSeparation);
            }
            if (orientation === 'NORTH' || orientation === 'SOUTH') {
                return this.width;
            }
            else if (orientation === 'WEST' || orientation === 'EAST') {
                return this.height;
            }
        },
        childrenCount: function () {
            return ((this.collapsed || !this.children) ? 0 : this.children.length);
        },
        childAt: function (index) {
            return this.dbGet(this.children[index]);
        },
        firstChild: function () {
            return this.childAt(0);
        },
        lastChild: function () {
            return this.childAt(this.children.length - 1);
        },
        parent: function () {
            return this.lookupNode(this.parentId);
        },
        leftNeighbor: function () {
            if (this.leftNeighborId) {
                return this.lookupNode(this.leftNeighborId);
            }
        },
        rightNeighbor: function () {
            if (this.rightNeighborId) {
                return this.lookupNode(this.rightNeighborId);
            }
        },
        leftSibling: function () {
            var leftNeighbor = this.leftNeighbor();
            if (leftNeighbor && leftNeighbor.parentId === this.parentId) {
                return leftNeighbor;
            }
        },
        rightSibling: function () {
            var rightNeighbor = this.rightNeighbor();
            if (rightNeighbor && rightNeighbor.parentId === this.parentId) {
                return rightNeighbor;
            }
        },
        childrenCenter: function () {
            var first = this.firstChild(), last = this.lastChild();
            return (first.prelim + ((last.prelim - first.prelim) + last.size()) / 2);
        },
        collapsedParent: function () {
            var parent = this.parent();
            if (!parent) {
                return false;
            }
            if (parent.collapsed) {
                return parent;
            }
            return parent.collapsedParent();
        },
        leftMost: function (level, depth) {
            if (level >= depth) {
                return this;
            }
            if (this.childrenCount() === 0) {
                return;
            }
            for (var i = 0, n = this.childrenCount(); i < n; i++) {
                var leftmostDescendant = this.childAt(i).leftMost(level + 1, depth);
                if (leftmostDescendant) {
                    return leftmostDescendant;
                }
            }
        },
        connectorPoint: function (startPoint) {
            var orient = this.Tree().CONFIG.rootOrientation, point = {};
            if (this.stackParentId) {
                if (orient === 'NORTH' || orient === 'SOUTH') {
                    orient = 'WEST';
                }
                else if (orient === 'EAST' || orient === 'WEST') {
                    orient = 'NORTH';
                }
            }
            if (orient === 'NORTH') {
                point.x = (this.pseudo) ? this.X - this.Tree().CONFIG.subTeeSeparation / 2 : this.X + this.width / 2;
                point.y = (startPoint) ? this.Y + this.height : this.Y;
            }
            else if (orient === 'SOUTH') {
                point.x = (this.pseudo) ? this.X - this.Tree().CONFIG.subTeeSeparation / 2 : this.X + this.width / 2;
                point.y = (startPoint) ? this.Y : this.Y + this.height;
            }
            else if (orient === 'EAST') {
                point.x = (startPoint) ? this.X : this.X + this.width;
                point.y = (this.pseudo) ? this.Y - this.Tree().CONFIG.subTeeSeparation / 2 : this.Y + this.height / 2;
            }
            else if (orient === 'WEST') {
                point.x = (startPoint) ? this.X + this.width : this.X;
                point.y = (this.pseudo) ? this.Y - this.Tree().CONFIG.subTeeSeparation / 2 : this.Y + this.height / 2;
            }
            return point;
        },
        pathStringThrough: function () {
            var startPoint = this.connectorPoint(true), endPoint = this.connectorPoint(false);
            return ["M", startPoint.x + "," + startPoint.y, 'L', endPoint.x + "," + endPoint.y].join(" ");
        },
        drawLineThroughMe: function (hidePoint) {
            var pathString = hidePoint ?
                this.Tree().getPointPathString(hidePoint) :
                this.pathStringThrough();
            this.lineThroughMe = this.lineThroughMe || this.Tree()._R.path(pathString);
            var line_style = UTIL.cloneObj(this.connStyle.style);
            delete line_style['arrow-start'];
            delete line_style['arrow-end'];
            this.lineThroughMe.attr(line_style);
            if (hidePoint) {
                this.lineThroughMe.hide();
                this.lineThroughMe.hidden = true;
            }
        },
        addSwitchEvent: function (nodeSwitch) {
            var self = this;
            UTIL.addEvent(nodeSwitch, 'click', function (e) {
                e.preventDefault();
                if (self.getTreeConfig().callback.onBeforeClickCollapseSwitch.apply(self, [nodeSwitch, e]) === false) {
                    return false;
                }
                self.toggleCollapse();
                self.getTreeConfig().callback.onAfterClickCollapseSwitch.apply(self, [nodeSwitch, e]);
            });
        },
        collapse: function () {
            if (!this.collapsed) {
                this.toggleCollapse();
            }
            return this;
        },
        expand: function () {
            if (this.collapsed) {
                this.toggleCollapse();
            }
            return this;
        },
        toggleCollapse: function () {
            var oTree = this.getTree();
            if (!oTree.inAnimation) {
                oTree.inAnimation = true;
                this.collapsed = !this.collapsed;
                UTIL.toggleClass(this.nodeDOM, 'collapsed', this.collapsed);
                oTree.positionTree();
                var self = this;
                setTimeout(function () {
                    oTree.inAnimation = false;
                    oTree.CONFIG.callback.onToggleCollapseFinished.apply(oTree, [self, self.collapsed]);
                }, (oTree.CONFIG.animation.nodeSpeed > oTree.CONFIG.animation.connectorsSpeed) ?
                    oTree.CONFIG.animation.nodeSpeed :
                    oTree.CONFIG.animation.connectorsSpeed);
            }
            return this;
        },
        hide: function (collapse_to_point) {
            collapse_to_point = collapse_to_point || false;
            var bCurrentState = this.hidden;
            this.hidden = true;
            this.nodeDOM.style.overflow = 'hidden';
            var tree = this.getTree(), config = this.getTreeConfig(), oNewState = {
                opacity: 0
            };
            if (collapse_to_point) {
                oNewState.left = collapse_to_point.x;
                oNewState.top = collapse_to_point.y;
            }
            if (!this.positioned || bCurrentState) {
                this.nodeDOM.style.visibility = 'hidden';
                if ($) {
                    $(this.nodeDOM).css(oNewState);
                }
                else {
                    this.nodeDOM.style.left = oNewState.left + 'px';
                    this.nodeDOM.style.top = oNewState.top + 'px';
                }
                this.positioned = true;
            }
            else {
                if ($) {
                    $(this.nodeDOM).animate(oNewState, config.animation.nodeSpeed, config.animation.nodeAnimation, function () {
                        this.style.visibility = 'hidden';
                    });
                }
                else {
                    this.nodeDOM.style.transition = 'all ' + config.animation.nodeSpeed + 'ms ease';
                    this.nodeDOM.style.transitionProperty = 'opacity, left, top';
                    this.nodeDOM.style.opacity = oNewState.opacity;
                    this.nodeDOM.style.left = oNewState.left + 'px';
                    this.nodeDOM.style.top = oNewState.top + 'px';
                    this.nodeDOM.style.visibility = 'hidden';
                }
            }
            if (this.lineThroughMe) {
                var new_path = tree.getPointPathString(collapse_to_point);
                if (bCurrentState) {
                    this.lineThroughMe.attr({ path: new_path });
                }
                else {
                    tree.animatePath(this.lineThroughMe, tree.getPointPathString(collapse_to_point));
                }
            }
            return this;
        },
        hideConnector: function () {
            var oTree = this.Tree();
            var oPath = oTree.connectionStore[this.id];
            if (oPath) {
                oPath.animate({ 'opacity': 0 }, oTree.CONFIG.animation.connectorsSpeed, oTree.CONFIG.animation.connectorsAnimation);
            }
            return this;
        },
        show: function () {
            var bCurrentState = this.hidden;
            this.hidden = false;
            this.nodeDOM.style.visibility = 'visible';
            var oTree = this.Tree();
            var oNewState = {
                left: this.X,
                top: this.Y,
                opacity: 1
            }, config = this.getTreeConfig();
            if ($) {
                $(this.nodeDOM).animate(oNewState, config.animation.nodeSpeed, config.animation.nodeAnimation, function () {
                    this.style.overflow = "";
                });
            }
            else {
                this.nodeDOM.style.transition = 'all ' + config.animation.nodeSpeed + 'ms ease';
                this.nodeDOM.style.transitionProperty = 'opacity, left, top';
                this.nodeDOM.style.left = oNewState.left + 'px';
                this.nodeDOM.style.top = oNewState.top + 'px';
                this.nodeDOM.style.opacity = oNewState.opacity;
                this.nodeDOM.style.overflow = '';
            }
            if (this.lineThroughMe) {
                this.getTree().animatePath(this.lineThroughMe, this.pathStringThrough());
            }
            return this;
        },
        showConnector: function () {
            var oTree = this.Tree();
            var oPath = oTree.connectionStore[this.id];
            if (oPath) {
                oPath.animate({ 'opacity': 1 }, oTree.CONFIG.animation.connectorsSpeed, oTree.CONFIG.animation.connectorsAnimation);
            }
            return this;
        }
    };
    TreeNode.prototype.handleButton = function (event) {
        console.log(event.target.value);
        var dialog = document.querySelector('dialog');
        dialog.showModal();
    };
    TreeNode.prototype.MakeButtons = function (buttonInfo, id) {
        button = document.createElement('button');
        var svgURI = buttonInfo.label;
        var svg = document.createElement('img');
        svg.src = svgURI;
        svg.style = "height: 16px;";
        svg.value = id;
        button.className = "mdl-button mdl-js-button mdl-button--accent";
        button.appendChild(svg);
        button.onclick = buttonInfo.onClick;
        button.value = id;
        button.style = "min-width: 16px;";
        return button;
    };
    TreeNode.prototype.buildOnlySingleNodeFromTextWithThiz = function (node, currentThis) {
        var thiz;
        thiz = (currentThis) ? currentThis : this;
        node.style = (thiz.spouse) ?
            "background: #f0f1f2; width: 50%; margin: 4px; margin-top:8px; padding: 2px;   word-break: break-all;white-space: normal;min-width:120px;max-width:220px;"
            :
                "background: #f0f1f2; margin: 4px; margin-top:8px; padding: 2px;   word-break: break-all; white-space: normal;width:100%; max-width: 200px;min-width:140px;max-width:220px;";
        if (thiz.image) {
            image = document.createElement('img');
            image.src = thiz.image;
            node.appendChild(image);
        }
        if (!thiz.button) {
            thiz.button = (thiz.text.button) ? thiz.text.button : null;
        }
        if (thiz.button) {
            node.id = "containerPerson_" + thiz.button.id;
            node.classList.add("containerPerson");
            var divForPoint = document.createElement('div');
            divForPoint.id = "point" + thiz.button.id;
            divForPoint.style = "height: 0px; width: 1px; margin: auto; margin-top: 0px;";
            node.appendChild(divForPoint);
            var containerButtons = document.createElement('div');
            containerButtons.style = "display:flex; justify-content: flex-end;";
            var buttonShowParentTree = this.MakeButtons(this.button.onClick.showUpTree, thiz.button.id);
            buttonShowParentTree.style = "height: 30px; min-width:16px; display:flex; padding: 0px; justify-content: center;";
            componentHandler.upgradeElement(buttonShowParentTree);
            containerButtons.appendChild(buttonShowParentTree);
            node.appendChild(containerButtons);
            containerButtons.className = "containerButtons";
        }
        if (thiz.text) {
            for (var key in thiz.text) {
                if (key.startsWith("data-")) {
                    node.setAttribute(key, thiz.text[key]);
                }
                else {
                    if (!thiz.text[key]) {
                        continue;
                    }
                    var textElement = document.createElement(thiz.text[key].href ? 'a' : 'p');
                    if (thiz.text[key].href) {
                        textElement.href = thiz.text[key].href;
                        if (thiz.text[key].target) {
                            textElement.target = thiz.text[key].target;
                        }
                    }
                    textElement.className = "containerText";
                    if ("button" !== key) {
                        textElement.appendChild(document.createTextNode(thiz.text[key].val ? thiz.text[key].val :
                            thiz.text[key] instanceof Object ? "'val' param missing!" : thiz.text[key]));
                    }
                    node.appendChild(textElement);
                }
            }
        }
        if (thiz.button) {
            var emptyDivForSpace = document.createElement('div');
            emptyDivForSpace.style = "flex-grow: 1";
            var containerButtons = document.createElement('div');
            containerButtons.style = "display:flex; justify-content: flex-end; ";
            var buttonShowChildrenTree = this.MakeButtons(this.button.onClick.showDownTree, thiz.button.id);
            buttonShowChildrenTree.style = "margin-top: 26px ;height: 30px; min-width: 16px; display:flex; padding: 0px; justify-content: center;";
            componentHandler.upgradeElement(buttonShowChildrenTree);
            node.appendChild(emptyDivForSpace);
            node.appendChild(containerButtons);
            containerButtons.className = "containerButtons";
            if (isLogIn()) {
                var button = document.createElement('button');
                button.innerText = thiz.button.label;
                button.value = thiz.button.id;
                button.onclick = thiz.button.onClick.addButton;
                button.className = "mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab";
                componentHandler.upgradeElement(button);
                button.style = "background-color: #ef8d04; margin-bottom: 8px;";
                var containerAddPerson = document.createElement('div');
                containerAddPerson.className = "containerAddPerson";
                containerAddPerson.appendChild(button);
                containerButtons.appendChild(containerAddPerson);
            }
            containerButtons.appendChild(buttonShowChildrenTree);
        }
        return node;
    };
    TreeNode.prototype.buildOnlySingleNodeFromText = function (node) {
        node.style = "background: #f0f1f2";
        if (this.image) {
            image = document.createElement('img');
            image.src = this.image;
            node.appendChild(image);
        }
        if (this.text) {
            for (var key in this.text) {
                if (key.startsWith("data-")) {
                    node.setAttribute(key, this.text[key]);
                }
                else {
                    var textElement = document.createElement(this.text[key].href ? 'a' : 'p');
                    if (this.text[key].href) {
                        textElement.href = this.text[key].href;
                        if (this.text[key].target) {
                            textElement.target = this.text[key].target;
                        }
                    }
                    textElement.className = "containerText";
                    textElement.style = "font-family: 16px; ";
                    textElement.appendChild(document.createTextNode(this.text[key].val ? this.text[key].val :
                        this.text[key] instanceof Object ? "'val' param missing!" : this.text[key]));
                    node.appendChild(textElement);
                }
            }
        }
        if (this.button) {
            node.id = "containerPerson_" + this.button.id;
            node.classList.add("containerPerson");
            var divForPoint = document.createElement('div');
            divForPoint.id = "point" + this.button.id;
            divForPoint.style = "height: 1px; width: 1px; margin: auto;";
            node.appendChild(divForPoint);
            if (isLogIn()) {
                var button = document.createElement('button');
                button.innerText = this.button.label;
                button.value = this.button.id;
                button.onclick = this.button.onClick.addButton;
                button.className = "mdl-button mdl-js-button mdl-button--fab mdl-button--colored";
                componentHandler.upgradeElement(button);
                var containerAddPerson = document.createElement('div');
                containerAddPerson.className = "containerAddPerson";
                containerAddPerson.appendChild(button);
                node.appendChild(containerAddPerson);
            }
            var containerButtons = document.createElement('div');
            var buttonShowParentTree = this.MakeButtons(this.button.onClick.showUpTree, this.button.id);
            var buttonShowChildrenTree = this.MakeButtons(this.button.onClick.showDownTree, this.button.id);
            componentHandler.upgradeElement(buttonShowParentTree);
            componentHandler.upgradeElement(buttonShowChildrenTree);
            containerButtons.appendChild(buttonShowChildrenTree);
            containerButtons.appendChild(buttonShowParentTree);
            node.appendChild(containerButtons);
            containerButtons.className = "containerButtons";
        }
        return node;
    };
    TreeNode.prototype.buildNodeFromText = function (node) {
        if (this.spouse) {
            divElem1 = document.createElement('div');
            divElem1.style.float = 'left';
            divElem1.style.border = 'solid';
            divElem1.style.padding = '2px';
            this.buildOnlySingleNodeFromTextWithThiz(divElem1, this);
            node.appendChild(divElem1);
            divElem2 = document.createElement('div');
            divElem2.style.border = 'solid';
            divElem2.style.padding = '2px';
            this.buildOnlySingleNodeFromTextWithThiz(divElem2, this.spouse);
            node.appendChild(divElem2);
            node.style.display = 'flex';
            return node;
        }
        else {
            return this.buildOnlySingleNodeFromTextWithThiz(node);
        }
    };
    TreeNode.prototype.buildNodeFromHtml = function (node) {
        if (this.nodeInnerHTML.charAt(0) === "#") {
            var elem = document.getElementById(this.nodeInnerHTML.substring(1));
            if (elem) {
                node = elem.cloneNode(true);
                node.id += "-clone";
                node.className += " node";
            }
            else {
                node.innerHTML = "<b> Wrong ID selector </b>";
            }
        }
        else {
            node.innerHTML = this.nodeInnerHTML;
        }
        return node;
    };
    TreeNode.prototype.createGeometry = function (tree) {
        if (this.id === 0 && tree.CONFIG.hideRootNode) {
            this.width = 0;
            this.height = 0;
            return;
        }
        var drawArea = tree.drawArea, image, node = document.createElement(this.link.href ? 'a' : 'div');
        node.className = (!this.pseudo) ? TreeNode.CONFIG.nodeHTMLclass : 'pseudo';
        if (this.nodeHTMLclass && !this.pseudo) {
            node.className += ' ' + this.nodeHTMLclass;
        }
        if (this.nodeHTMLid) {
            node.id = this.nodeHTMLid;
        }
        if (this.link.href) {
            node.href = this.link.href;
            node.target = this.link.target;
        }
        if ($) {
            $(node).data('treenode', this);
        }
        else {
            node.data = {
                'treenode': this
            };
        }
        if (!this.pseudo) {
            node = this.nodeInnerHTML ? this.buildNodeFromHtml(node) : this.buildNodeFromText(node);
            if (this.collapsed || (this.collapsable && this.childrenCount() && !this.stackParentId)) {
                this.createSwitchGeometry(tree, node);
            }
        }
        tree.CONFIG.callback.onCreateNode.apply(tree, [this, node]);
        var button12 = document.createElement("button");
        drawArea.appendChild(node);
        this.width = node.offsetWidth;
        this.height = node.offsetHeight;
        this.nodeDOM = node;
        tree.imageLoader.processNode(this);
    };
    TreeNode.prototype.createSwitchGeometry = function (tree, nodeEl) {
        nodeEl = nodeEl || this.nodeDOM;
        var nodeSwitchEl = UTIL.findEl('.collapse-switch', true, nodeEl);
        if (!nodeSwitchEl) {
            nodeSwitchEl = document.createElement('a');
            nodeSwitchEl.className = "collapse-switch";
            nodeEl.appendChild(nodeSwitchEl);
            this.addSwitchEvent(nodeSwitchEl);
            if (this.collapsed) {
                nodeEl.className += " collapsed";
            }
            tree.CONFIG.callback.onCreateNodeCollapseSwitch.apply(tree, [this, nodeEl, nodeSwitchEl]);
        }
        return nodeSwitchEl;
    };
    Tree.CONFIG = {
        maxDepth: 100,
        rootOrientation: 'NORTH',
        nodeAlign: 'CENTER',
        levelSeparation: 30,
        siblingSeparation: 30,
        subTeeSeparation: 30,
        hideRootNode: false,
        animateOnInit: false,
        animateOnInitDelay: 500,
        padding: 15,
        scrollbar: 'native',
        connectors: {
            type: 'curve',
            style: {
                stroke: 'black'
            },
            stackIndent: 15
        },
        node: {
            link: {
                target: '_self'
            }
        },
        animation: {
            nodeSpeed: 450,
            nodeAnimation: 'linear',
            connectorsSpeed: 450,
            connectorsAnimation: 'linear'
        },
        callback: {
            onCreateNode: function (treeNode, treeNodeDom) { },
            onCreateNodeCollapseSwitch: function (treeNode, treeNodeDom, switchDom) { },
            onAfterAddNode: function (newTreeNode, parentTreeNode, nodeStructure) { },
            onBeforeAddNode: function (parentTreeNode, nodeStructure) { },
            onAfterPositionNode: function (treeNode, nodeDbIndex, containerCenter, treeCenter) { },
            onBeforePositionNode: function (treeNode, nodeDbIndex, containerCenter, treeCenter) { },
            onToggleCollapseFinished: function (treeNode, bIsCollapsed) { },
            onAfterClickCollapseSwitch: function (nodeSwitch, event) { },
            onBeforeClickCollapseSwitch: function (nodeSwitch, event) { },
            onTreeLoaded: function (rootTreeNode) { }
        }
    };
    TreeNode.CONFIG = {
        nodeHTMLclass: 'node'
    };
    var JSONconfig = {
        make: function (configArray) {
            var i = configArray.length, node;
            this.jsonStructure = {
                chart: null,
                nodeStructure: null
            };
            while (i--) {
                node = configArray[i];
                if (node.hasOwnProperty('container')) {
                    this.jsonStructure.chart = node;
                    continue;
                }
                if (!node.hasOwnProperty('parent') && !node.hasOwnProperty('container')) {
                    this.jsonStructure.nodeStructure = node;
                    node._json_id = 0;
                }
            }
            this.findChildren(configArray);
            return this.jsonStructure;
        },
        findChildren: function (nodes) {
            var parents = [0];
            while (parents.length) {
                var parentId = parents.pop(), parent = this.findNode(this.jsonStructure.nodeStructure, parentId), i = 0, len = nodes.length, children = [];
                for (; i < len; i++) {
                    var node = nodes[i];
                    if (node.parent && (node.parent._json_id === parentId)) {
                        node._json_id = this.getID();
                        delete node.parent;
                        children.push(node);
                        parents.push(node._json_id);
                    }
                }
                if (children.length) {
                    parent.children = children;
                }
            }
        },
        findNode: function (node, nodeId) {
            var childrenLen, found;
            if (node._json_id === nodeId) {
                return node;
            }
            else if (node.children) {
                childrenLen = node.children.length;
                while (childrenLen--) {
                    found = this.findNode(node.children[childrenLen], nodeId);
                    if (found) {
                        return found;
                    }
                }
            }
        },
        getID: (function () {
            var i = 1;
            return function () {
                return i++;
            };
        })()
    };
    var Treant = function (jsonConfig, callback, jQuery) {
        if (jsonConfig instanceof Array) {
            jsonConfig = JSONconfig.make(jsonConfig);
        }
        if (jQuery) {
            $ = jQuery;
        }
        this.tree = TreeStore.createTree(jsonConfig);
        this.tree.positionTree(callback);
    };
    Treant.prototype.destroy = function () {
        TreeStore.destroy(this.tree.id);
    };
    window.Treant = Treant;
})();
//# sourceMappingURL=Treant-ch.js.map