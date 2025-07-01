source "https://rubygems.org"
ruby ">= 2.6.10"

gem 'abbrev'
gem 'logger'
gem 'mutex_m'
gem 'csv'
gem "fastlane"
gem "cocoapods"

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'


plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
