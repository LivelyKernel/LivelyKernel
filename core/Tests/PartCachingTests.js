module('Tests.PartCachingTests').requires('lively.TestFramework', 'lively.PartCaching').toRun(function() {
    
    TestCase.subclass('Tests.PartCachingTests.Tests', {
        partName : 'TestEllipse',
        spaceName : 'PartsBin/Tests',
        setUp: function() {
    		Config.PartCachingEnabled = true;
            lively.PartCaching.setupCache();
    	},
        testCache: function() {
            this.assert(lively.PartCache);
        },
        testCacheInitiallyEmpty: function() {
            this.assertEquals(Properties.own(lively.PartCache.cache).length, 0);
        },
        testClearCache: function() {
            lively.PartCache.ensurePartObject('partName', 'spaceName');
            lively.PartCache.clearCache();
            
            this.assertEquals(Properties.own(lively.PartCache.cache).length, 0);
        },
        testCachingOnLoadPartItem: function() {
            $world.loadPartItem(this.partName, this.spaceName);
            
            this.assert(lively.PartCache.getPart(this.partName, this.spaceName));
        },
        testCachingOnPartsBinLoad: function() {
            lively.PartsBin.getPart(this.partName, this.spaceName);
            
            this.assert(lively.PartCache.getPart(this.partName, this.spaceName));
        },
        testCacheHitOnLoadPartItem: function() {
            $world.loadPartItem(this.partName, this.spaceName);   
            var cachedMetaInfoBefore = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            $world.loadPartItem(this.partName, this.spaceName);
            var cachedMetaInfoAfter = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            
            this.assert(cachedMetaInfoBefore === cachedMetaInfoAfter);
        },
        testReloadFromPartsBin: function() {            
            $world.loadPartItem(this.partName, this.spaceName);
            var cachedMetaInfoBefore = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            lively.PartsBin.getPart(this.partName, this.spaceName);
            var cachedMetaInfoAfter = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            
            this.assert(cachedMetaInfoBefore != cachedMetaInfoAfter);
        },
        testUploadPartInvalidsCache: function() {
            var part = $world.loadPartItem(this.partName, this.spaceName);
            part.copyToPartsBin(this.spaceName);
                        
            this.assert(!lively.PartCache.getPart(this.partName, this.spaceName));
        },
        testNoCacheHitsWhileDisabled: function() {
            Config.PartCachingEnabled = false;
            
            $world.loadPartItem(this.partName, this.spaceName);   
            var cachedMetaInfoBefore = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            $world.loadPartItem(this.partName, this.spaceName);
            var cachedMetaInfoAfter = lively.PartCache.getPart(this.partName, this.spaceName).metaInfo;
            
            this.assert(cachedMetaInfoBefore !== cachedMetaInfoAfter);
        }
    });
    
}) // end of module