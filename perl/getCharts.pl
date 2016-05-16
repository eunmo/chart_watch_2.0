use DateTime;
use Getopt::Std;

my $end = 2000;
my $port = 3020;

my $date = DateTime->today();

my %options = ();
getopts('bodufmgs:e:p:', \%options);

if (defined $options{'s'} && $date->year() != $options{'s'}) {
	my $start = $options{'s'};
	$date = DateTime->new(year => $start, month => 12, day => 31);
	$end = $start;
}

if (defined $options{'e'}) {
	$end = $options{'e'};
}

$port = $options{'p'} if defined $options{'p'};
$subWeeks = 1;

$subWeeks = 2 if defined $options{'b'} && $date->day_of_week() < 3;
$subWeeks = 2 if defined $options{'o'} && $date->day_of_week() < 2;
$subWeeks = 2 if defined $options{'g'} && $date->day_of_week() < 4;

$date->truncate( to => 'week' )->subtract( weeks => $subWeeks );
$date->add( days => 5 );

my $end_date = $date;
$date = DateTime->new(year => 2010, month => 1, day => 2);

while ($date <= $end_date) {
	my $yy = $date->year;
	my $mm = $date->month;
	my $dd = $date->day;
	my $dateString = "year=$yy&month=$mm&day=$dd";
	
	print $date->ymd(), "\n";

	getChart("billboard?$dateString")	if defined $options{'b'};
	getChart("oricon?$dateString")		if defined $options{'o'};
	getChart("deutsche?$dateString")	if defined $options{'d'};
	getChart("uk?$dateString")				if defined $options{'u'};
	getChart("francais?$dateString")	if defined $options{'f'};
	getChart("melon?$dateString")			if defined $options{'m'};
	getChart("gaon?$dateString")			if defined $options{'g'};

	$date->add( weeks => 1);
}

sub getChart($)
{
	my $chart = shift;

	my $url = "\"http://localhost:$port/fetch_chart/single/$chart\"";
	system("curl $url > /dev/null 2>&1");
}
