use LWP;
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
									 ->truncate( to => 'week')
									 ->add( days => 4 );
my $base_date = DateTime->new( year => 1999, month => 12, day => 31);

my $dur = $date->delta_days( $base_date );

my $days = $dur->in_units('days');
my $chart_id = (10960 + $days) * 86400;
my $url = "https://www.offiziellecharts.de/charts/single/for-date-${chart_id}000";

my $browser = LWP::UserAgent->new();
my $response = $browser->get($url);
my $html = $response->content;
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";
for my $td ($dom->find('td[class*="ch-info"]')->each) {
	my $title = $td->find('span[class*="info-title"]')->first->text;
	my $artist = $td->find('span[class*="info-artist"]')->first->text;
	my $artist_norm = normalize_artist($artist);
	my $title_norm = normalize_title($title);
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\" }";
	$rank++;
}

print "]";

sub normalize_title($)
{
	my $string = shift;
	$string = decode('utf-8', $string) unless utf8::is_utf8($string);

	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	$string = decode('utf-8', $string) unless utf8::is_utf8($string);
	
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;

	return $string;
}
