"""Synthetic runtime scan gate regressions; never invoke a scanner or Docker."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

GATE = Path(__file__).with_name('image-summary.py')
SECRET = 'SYNTHETIC_SECRET_MUST_NEVER_APPEAR'

def report(severities=(), known=True, packages=12):
    return {'known_os': known, 'results': [{'os_packages': True, 'packages': packages, 'severities': list(severities)}]}

class RuntimeGate(unittest.TestCase):
    def run_gate(self, data, status=0):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'safe.json'
            path.write_text(data if isinstance(data, str) else json.dumps(data), encoding='utf-8')
            return subprocess.run([sys.executable, '-X', 'utf8', str(GATE), str(path), str(status)], capture_output=True, text=True, check=False)

    def test_high_and_critical_block_even_when_scanner_exit_is_zero(self):
        for severity in ['HIGH', 'CRITICAL']:
            with self.subTest(severity=severity):
                result = self.run_gate(report([severity]))
                self.assertEqual(result.returncode, 1)
                summary = json.loads(result.stdout)
                self.assertEqual(summary['severity_counts'][severity], 1)
                self.assertEqual(summary['status'], 'BLOCKED')

    def test_clean_known_os_inventory_passes_and_all_counts_are_visible(self):
        result = self.run_gate(report(['LOW', 'MEDIUM', 'UNKNOWN']))
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertEqual(summary['severity_counts'], {'UNKNOWN': 1, 'LOW': 1, 'MEDIUM': 1, 'HIGH': 0, 'CRITICAL': 0})
        self.assertEqual(summary['status'], 'PASS')

    def test_unknown_os_missing_inventory_and_scanner_error_block(self):
        for data, status in [(report(known=False), 0), (report(packages=0), 0), ({'known_os': True, 'results': [{'os_packages': False, 'packages': 12, 'severities': []}]}, 0), ({'known_os': True, 'results': []}, 0), (report(), 2), (report(), 1)]:
            with self.subTest(data=data, status=status):
                self.assertEqual(self.run_gate(data, status).returncode, 1)

    def test_secret_marker_in_malformed_or_unexpected_data_is_never_printed(self):
        for data in [SECRET, {'ArtifactName': SECRET}, {**report(), 'Config': {'Env': [SECRET]}}, report([SECRET])]:
            with self.subTest(data=data):
                result = self.run_gate(data)
                self.assertEqual(result.returncode, 1)
                self.assertNotIn(SECRET, result.stdout + result.stderr)
                self.assertEqual(result.stderr, '')

if __name__ == '__main__':
    unittest.main()
