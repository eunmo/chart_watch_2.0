use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];

my $ld = DateTime->new( year => $yy, month => $mm, day => $dd )
								 ->truncate( to => 'week' )
								 ->add( days => 6 );
my $ld_ymd = $ld->ymd('');

my $cur_date = DateTime->today();

my $url = "http://www.officialcharts.com/charts/singles-chart/$ld_ymd/7501";

if ($cur_date->add( days => 2) == $ld) {
	$url = "http://www.officialcharts.com/charts/singles-chart";
}

my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;
my $count = 1;

print "[";

for my $div ($dom->find('div[class*="title-artist"]')->each) {
	my $title;
	if ($div->find('div[class="title"]')->first) {
		$title = $div->find('div[class="title"]')->first->find('a')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('div[class="artist"]')->first) {
		my $artist = $div->find('div[class="artist"]')->first->find('a')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\" }";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;
	
	return $string;
}
