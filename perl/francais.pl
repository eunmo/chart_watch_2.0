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
									 ->truncate( to => 'week' )
									 ->subtract( days => 3 );

my $year = $date->week_year();

print "[";

if (($year == 2005 && $date->month() == 3 && $date->day() == 4) ||  #2007.01.20
	  ($year == 2007 && $date->month() == 1 && $date->day() == 12) ||	#2005.03.12
		($year == 2015 && $date->month() >= 2) ||
	  ($year >= 2016))	{
	my $week = $date->week_number();

	if ($year == 2016) {
		if ($week == 53) {
			$week = 1;
		} else {
			$week++;
		}
	}
	elsif ($year == 2007) {
		$week--;
	}
	
	my $week_string = sprintf("%02d", $week);
	my $chart = ($year < 2015) ? "top-singles" : "top-singles-telecharges";
	my $url = "http://www.snepmusique.com/tops-semaine/$chart/?ye=$year&we=$week_string";
	my $html = `curl -s "$url"`;
	my $dom = Mojo::DOM->new($html);
	my $rank = 1;

	for my $div ($dom->find('div[class*="infos"]')->each) {
		my $title = $div->find('[class="title"]')->first->text;
		my $artist = $div->find('[class="artist"]')->first->text;
		my $title_norm = normalize_title($title);
		my $artist_norm = normalize_artist($artist);
		print ",\n" if $rank > 1;
		print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\" }";
		$rank++;
	}
} else {
	if ($year < 2003 || ($year == 2003 && $date->month() < 4) ||
		  ($year == 2003 && $date->month() == 4 && $date->day() < 26)) {
		$date->add( days => 1 );
	} elsif ($year < 2005 ||
		  	 	 ($year == 2005 && $date->month() < 3)) {
		$date->subtract( days => 5 );
	} elsif ($year < 2012 ||
	         ($year == 2012 && $date->month() < 11)) 	{
		$date->add( days => 1 );
	} else {
		$date->add( days => 8 );
	}
	my $yy = $date->year();
	my $ymd = $date->ymd('');
	my $url = "http://www.lescharts.com/weekchart.asp?cat=s&year=$yy&date=$ymd";
	my $html = get("$url");

	my $dom = Mojo::DOM->new($html);
	my $rank = 1;

	for my $div ($dom->find('a[class*="navb"]')->each) {
		my $title = $div->text;
		my $artist = $div->find('b')->first->text;
		my $title_norm = normalize_title($title);
		my $artist_norm = normalize_artist($artist);
		print ",\n" if $rank > 1;
		print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"title\" : \"$title_norm\" }";
		$rank++;
	}
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

	$string =~ s/\|.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/^\s+//g;
	$string =~ s/[\'’"`]/\'/g;
	$string =~ s/[\\]/\//g;

	return $string;
}
