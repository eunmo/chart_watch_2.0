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
								 ->add( weeks => 2)
								 ->add( days => 5 );
my $ld_ymd = $ld->ymd();

my $url = "http://www.billboard.com/charts/hot-100/$ld_ymd";
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="row__title"]')->each) {
	my $title_norm;
	if ($div->find('h2')->first) {
		my $title = $div->find('h2')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist;
	if ($div->find('a[data-tracklabel="Artist Name"]')->first) {
		$artist = $div->find('a[data-tracklabel="Artist Name"]')->first->text;
	} elsif ($div->find('h3')->first) {
		$artist = $div->find('h3')->first->text;
	}
	my $artist_norm = normalize_artist($artist);
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
