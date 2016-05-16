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

my $date = DateTime->new( year => $yy, month => $mm, day => $dd )
									 ->add( weeks => 1)
									 ->add( days => 1);
$date = $date->add( weeks => 1) if ($yy == 2010);

my $year = $date->week_year();
my $week = $date->week_number();
$week++ if $year == 2011 && $yy == 2011;
my $week_string = sprintf("%02d", $week);

my $url = "http://www.gaonchart.co.kr/main/section/chart/online.gaon?nationGbn=T&serviceGbn=ALL&targetTime=$week_string&hitYear=$year&termGbn=week";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('td[class*="subject"]')->each) {
	my $title = $div->find('p')->first->text;
	my $artist = $div->find('p[class~="singer"]')->first->attr('title');
	my $title_norm = normalize_title($title);
	my $artist_norm = normalize_artist($artist);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\"	}";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;
	$string =~ s/\\/₩/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;

	$string =~ s/\|.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;

	return $string;
}
