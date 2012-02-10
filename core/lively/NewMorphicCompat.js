var reqs = Config.isNewMorphic ? [] : ['lively.Core'];

module('lively.NewMorphicCompat').requires(reqs).toRun(function() {

// this is for the old morphic system, however we have to go into the module body
// so the system knows that the module is loaded
if (Config.isNewMorphic) return;

module('lively.morphic');
// we use getters here because at the current point in the load process not
// all classes are loaded
Object.extend(lively.morphic, {
	get Morph() { return Morph },
	get Text() { return TextMorph },
	get World() { return WorldMorph },
	get Widget() { return Widget },
	get Box() { return BoxMorph },
	get Button() { return ButtonMorph },
	get Panel() { return PanelMorph },
	get HorizontalDivider() { return HorizontalDivider },
	get Slider() { return SliderMorph },
	get Menu() { return MenuMorph },
	get Image() { return ImageMorph },

	set Morph(v) { return Morph = v },
	set Text(v) { return TextMorph = v },
	set World(v) { return WorldMorph = v },
	set Widget(v) { return Widget = v },
	set Box(v) { return BoxMorph = v },
	set Button(v) { return ButtonMorph = v },
	set Panel(v) { return PanelMorph = v },
	set HorizontalDivider(v) { return HorizontalDivider = v },
	set Slider(v) { return SliderMorph = v },
	set Menu(v) { return MenuMorph = v },
	set Image(v) { return ImageMorph = v },
});




}) // end of module
