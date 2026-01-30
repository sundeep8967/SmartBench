#!/usr/bin/env python3
"""
Extract all Mermaid diagrams from PRD and architecture documents.

This script:
1. Recursively finds all .md files in the docs/ folder
2. Extracts all mermaid diagrams with context
3. Groups them by domain (Identity, Booking, Marketplace, Financial, etc.)
4. Organizes them logically within each domain
5. Outputs to diagrams.md in the same folder as this script
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
from dataclasses import dataclass


@dataclass
class Diagram:
    """Represents a Mermaid diagram with its context."""
    content: str
    file_path: str
    title: Optional[str] = None
    section: Optional[str] = None
    diagram_type: Optional[str] = None
    domain: Optional[str] = None


# Domain mapping based on file paths
DOMAIN_MAPPING = {
    'identity': ['identity', 'authentication', 'onboarding', 'rbac', 'user-roles'],
    'booking': ['booking', 'supervisor-assignment', 'weekly-payments'],
    'marketplace': ['marketplace', 'worker-search', 'availability', 'cart', 'inventory', 'saved-searches'],
    'financial': ['financial', 'wallet', 'ledger', 'payment', 'refund', 'tax'],
    'fulfillment': ['fulfillment', 'time-clock', 'verification', 'dispute', 'offline', 'timesheet'],
    'notifications': ['notification'],
    'messaging': ['messaging', 'chat', 'real-time-chat'],
    'system': ['system', 'background-jobs', 'error-handling', 'state-minimum', 'observability', 'monitoring', 'security', 'deployment', 'test-strategy'],
    'data': ['data-dictionary', 'schema', 'database', 'audit'],
    'prd': ['epic', 'customer-journey', 'feature-blueprint', 'rbac-acceptance', 'notifications-rbac'],
    'ux': ['ux', 'front-end', 'navigation', 'ui-design'],
    'general': ['document-reference', 'repository-structure', 'tech-stack', 'timezone']
}


def determine_domain(file_path: str, content: str) -> str:
    """Determine the domain based on file path and content."""
    file_lower = file_path.lower()
    
    # Check each domain's keywords
    for domain, keywords in DOMAIN_MAPPING.items():
        if any(keyword in file_lower for keyword in keywords):
            return domain.capitalize()
    
    # Default to General if no match
    return 'General'


def extract_diagram_type(diagram_content: str) -> str:
    """Extract the diagram type from mermaid content."""
    first_line = diagram_content.strip().split('\n')[0] if diagram_content.strip() else ''
    
    # Common mermaid diagram types
    types = ['flowchart', 'sequenceDiagram', 'stateDiagram-v2', 'stateDiagram', 'journey', 'gantt', 'graph', 'classDiagram', 'erDiagram']
    for diagram_type in types:
        if first_line.startswith(diagram_type):
            return diagram_type
    
    return 'unknown'


def extract_title_from_context(lines: List[str], diagram_start: int) -> Optional[str]:
    """Extract a title from the context before the diagram."""
    # Look back up to 5 lines for a title
    for i in range(max(0, diagram_start - 5), diagram_start):
        line = lines[i].strip()
        # Check for markdown headers or bold text that might be a title
        if line.startswith('#'):
            # Extract header text
            title = re.sub(r'^#+\s*', '', line).strip()
            if title and len(title) < 200:  # Reasonable title length
                return title
        elif line.startswith('**') and line.endswith('**'):
            title = line.strip('*').strip()
            if title and len(title) < 200:
                return title
        elif 'Diagram' in line or 'Flow' in line or 'Sequence' in line:
            # Check if this line contains diagram-related keywords
            title = re.sub(r'[*#]', '', line).strip()
            if title and len(title) < 200:
                return title
    
    return None


def extract_section_from_context(lines: List[str], diagram_start: int) -> Optional[str]:
    """Extract the section (header) from the context before the diagram."""
    # Look back for the most recent header
    for i in range(diagram_start - 1, max(0, diagram_start - 20), -1):
        line = lines[i].strip()
        if line.startswith('#'):
            # Return the header text
            return re.sub(r'^#+\s*', '', line).strip()
    return None


def extract_diagrams_from_file(file_path: Path, docs_dir: Path) -> List[Diagram]:
    """Extract all mermaid diagrams from a markdown file."""
    diagrams = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return diagrams
    
    # Find all mermaid code blocks
    pattern = r'```mermaid\s*\n(.*?)```'
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    for match in matches:
        diagram_content = match.group(1).strip()
        if not diagram_content:
            continue
        
        # Find the line number where this diagram starts
        diagram_start = content[:match.start()].count('\n')
        
        # Extract context
        title = extract_title_from_context(lines, diagram_start)
        section = extract_section_from_context(lines, diagram_start)
        diagram_type = extract_diagram_type(diagram_content)
        
        # Determine domain
        relative_path = str(file_path.relative_to(docs_dir))
        domain = determine_domain(relative_path, content)
        
        diagram = Diagram(
            content=diagram_content,
            file_path=relative_path,
            title=title,
            section=section,
            diagram_type=diagram_type,
            domain=domain
        )
        diagrams.append(diagram)
    
    return diagrams


def organize_diagrams_by_domain(diagrams: List[Diagram]) -> Dict[str, List[Diagram]]:
    """Organize diagrams by domain."""
    organized = defaultdict(list)
    
    for diagram in diagrams:
        organized[diagram.domain].append(diagram)
    
    # Sort diagrams within each domain by file path and then by order in file
    for domain in organized:
        organized[domain].sort(key=lambda d: (d.file_path, d.section or ''))
    
    return dict(organized)


def generate_diagrams_markdown(organized_diagrams: Dict[str, List[Diagram]]) -> str:
    """Generate the markdown content for diagrams.md."""
    output = []
    output.append("# System Diagrams")
    output.append("")
    output.append("This document contains all Mermaid diagrams extracted from PRD and architecture documents.")
    output.append("Diagrams are organized by domain for easy reference.")
    output.append("")
    output.append("---")
    output.append("")
    
    # Define domain order for logical presentation
    domain_order = [
        'Prd',
        'Identity',
        'Marketplace',
        'Booking',
        'Fulfillment',
        'Financial',
        'Notifications',
        'Messaging',
        'System',
        'Data',
        'Ux',
        'General'
    ]
    
    # Add domains in order
    for domain in domain_order:
        if domain not in organized_diagrams:
            continue
        
        diagrams = organized_diagrams[domain]
        if not diagrams:
            continue
        
        output.append(f"## {domain} Domain")
        output.append("")
        
        # Group by file for better organization
        diagrams_by_file = defaultdict(list)
        for diagram in diagrams:
            diagrams_by_file[diagram.file_path].append(diagram)
        
        for file_path in sorted(diagrams_by_file.keys()):
            file_diagrams = diagrams_by_file[file_path]
            
            output.append(f"### From: `{file_path}`")
            output.append("")
            
            for idx, diagram in enumerate(file_diagrams, 1):
                # Add diagram metadata
                if diagram.title:
                    output.append(f"**{diagram.title}**")
                    output.append("")
                elif diagram.section:
                    output.append(f"**{diagram.section}**")
                    output.append("")
                
                # Add diagram type and source info
                metadata_parts = []
                if diagram.diagram_type and diagram.diagram_type != 'unknown':
                    metadata_parts.append(f"Type: {diagram.diagram_type}")
                metadata_parts.append(f"Source: `{diagram.file_path}`")
                if diagram.section:
                    metadata_parts.append(f"Section: {diagram.section}")
                
                if metadata_parts:
                    output.append(f"*{', '.join(metadata_parts)}*")
                    output.append("")
                
                # Add the diagram
                output.append("```mermaid")
                output.append(diagram.content)
                output.append("```")
                output.append("")
                
                # Add separator between diagrams (except last one)
                if idx < len(file_diagrams):
                    output.append("---")
                    output.append("")
            
            # Add separator between files (except last one)
            if file_path != sorted(diagrams_by_file.keys())[-1]:
                output.append("")
                output.append("---")
                output.append("")
        
        # Add separator between domains (except last one)
        if domain != domain_order[-1]:
            output.append("")
            output.append("---")
            output.append("")
    
    # Add any domains not in the predefined order
    for domain in sorted(organized_diagrams.keys()):
        if domain not in domain_order:
            diagrams = organized_diagrams[domain]
            if not diagrams:
                continue
            
            output.append(f"## {domain} Domain")
            output.append("")
            
            for diagram in diagrams:
                if diagram.title:
                    output.append(f"**{diagram.title}**")
                    output.append("")
                
                output.append(f"*Source: `{diagram.file_path}`*")
                output.append("")
                output.append("```mermaid")
                output.append(diagram.content)
                output.append("```")
                output.append("")
                output.append("---")
                output.append("")
    
    return '\n'.join(output)


def main():
    """Main function to extract and organize diagrams."""
    # Get the script's directory (where this script is located)
    script_dir = Path(__file__).parent.absolute()
    
    # Docs directory is relative to project root
    # script is in the root, so project_root is script_dir
    project_root = script_dir
    docs_dir = project_root / 'docs'
    
    if not docs_dir.exists():
        print(f"Error: {docs_dir} directory not found")
        return
    
    print(f"Scanning {docs_dir} for Mermaid diagrams...")
    
    # Find all markdown files (exclude diagrams.md to avoid recursion)
    markdown_files = [f for f in docs_dir.rglob('*.md') if f.name != 'diagrams.md']
    print(f"Found {len(markdown_files)} markdown files")
    
    # Extract diagrams from all files
    all_diagrams = []
    for md_file in markdown_files:
        diagrams = extract_diagrams_from_file(md_file, docs_dir)
        all_diagrams.extend(diagrams)
        if diagrams:
            print(f"  Found {len(diagrams)} diagram(s) in {md_file.relative_to(docs_dir)}")
    
    print(f"\nTotal diagrams found: {len(all_diagrams)}")
    
    # Organize by domain
    organized = organize_diagrams_by_domain(all_diagrams)
    
    print("\nDiagrams by domain:")
    for domain in sorted(organized.keys()):
        print(f"  {domain}: {len(organized[domain])} diagram(s)")
    
    # Generate markdown
    output_content = generate_diagrams_markdown(organized)
    
    # Write to diagrams.md in the same folder as this script
    output_file = script_dir / 'diagrams.md'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"\n[SUCCESS] Diagrams extracted and saved to {output_file}")
    print(f"  Total diagrams: {len(all_diagrams)}")
    print(f"  Domains: {len(organized)}")


if __name__ == '__main__':
    main()
